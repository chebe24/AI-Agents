#!/usr/bin/env bash
# =============================================================================
# ai-agents.sh — Gateway-OS Deployment CLI
# Project : Gateway-OS / AI-Agents
# Author  : Cary Hebert
# Updated : 2026-03
#
# Commands:
#   auth   [dev|prod]    Check / rotate clasp OAuth + GitHub Secret
#   agent  <AgentName>   Scaffold a new Agent file in dev-project/agents/
#   deploy <dev|prod>    Push code to target GAS project via clasp
#   help                 Show this message
# =============================================================================
set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="$ROOT_DIR/dev-project"
PROD_DIR="$ROOT_DIR/prod-project"
AGENTS_DIR="$DEV_DIR/agents"

# ── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# =============================================================================
# FUNCTION: refresh_clasp_auth
#
# Checks if clasp can reach the GAS API. If the token is expired, it triggers
# a fresh login and automatically rotates the corresponding GitHub Secret so
# CI/CD stays in sync.
#
# GitHub Secrets:
#   CLASDEV_JSON  → ~/.clasprc.json for the dev account (cary.hebert@gmail.com)
#   CLASPRC       → ~/.clasprc.json for the prod account (chebert4@ebrschools.org)
# =============================================================================
refresh_clasp_auth() {
  local target="${1:-dev}"
  info "Checking clasp authentication for: $target ..."

  local project_dir
  [[ "$target" == "prod" ]] && project_dir="$PROD_DIR" || project_dir="$DEV_DIR"

  cd "$project_dir"

  if clasp list &>/dev/null; then
    info "Auth is valid. No rotation needed."
    cd "$ROOT_DIR"
    return 0
  fi

  warn "Auth expired or missing. Launching re-authentication..."
  clasp login --no-localhost

  local clasprc_path="$HOME/.clasprc.json"
  [[ -f "$clasprc_path" ]] || error "~/.clasprc.json not found after login. Cannot rotate secret."

  local secret_name
  [[ "$target" == "prod" ]] && secret_name="CLASPRC" || secret_name="CLASDEV_JSON"

  info "Rotating GitHub Secret: $secret_name ..."
  gh secret set "$secret_name" < "$clasprc_path"
  info "Secret '$secret_name' rotated successfully."

  cd "$ROOT_DIR"
}

# =============================================================================
# FUNCTION: create_agent
#
# Scaffolds a new Agent file in dev-project/agents/ with standard boilerplate.
# An "Agent" is a self-contained automation handler that plugs into Router.gs.
#
# Usage : ./ai-agents.sh agent Journal
# Creates: dev-project/agents/JournalAgent.gs
#
# After creation, register the route in dev-project/Router.gs:
#   case "journal":
#     return JournalAgent_init(payload);
# =============================================================================
create_agent() {
  local agent_name="${1:-}"
  [[ -z "$agent_name" ]] && error "Agent name required. Usage: ./ai-agents.sh agent <Name>"

  # Normalize: strip non-alphanumeric, capitalize first letter
  agent_name="$(echo "$agent_name" | sed 's/[^a-zA-Z0-9]//g')"
  agent_name="${agent_name^}"

  local agent_file="$AGENTS_DIR/${agent_name}Agent.gs"
  mkdir -p "$AGENTS_DIR"

  [[ -f "$agent_file" ]] && error "Agent already exists: $agent_file"

  local action_key
  action_key="$(echo "$agent_name" | tr '[:upper:]' '[:lower:]')"

  info "Scaffolding new Agent: ${agent_name}Agent.gs ..."

  cat > "$agent_file" <<TEMPLATE
/**
 * @file      ${agent_name}Agent.gs
 * @author    Cary Hebert
 * @created   $(date +%Y-%m-%d)
 * @version   1.0.0
 *
 * Gateway-OS Agent — handles all "${action_key}" webhook actions.
 *
 * ROUTER CONTRACT
 *   Router.gs calls ${agent_name}Agent_init(payload) when payload.action === "${action_key}"
 *   Return shape: { status: "ok"|"error", message: String, data?: Any }
 *
 * REGISTRATION (add to dev-project/Router.gs switch statement):
 *   case "${action_key}":
 *     return ${agent_name}Agent_init(payload);
 */

/**
 * Entry point called by the Router.
 * @param {Object} payload - Parsed JSON from the incoming webhook POST body.
 * @returns {{ status: string, message: string, data?: any }}
 */
function ${agent_name}Agent_init(payload) {
  try {
    logEvent('${agent_name^^}_AGENT_START', { payload: JSON.stringify(payload) });

    // ── TODO: Implement ${agent_name} logic below ──────────────────────────
    var result = _${agent_name}Agent_process(payload);
    // ────────────────────────────────────────────────────────────────────

    logEvent('${agent_name^^}_AGENT_COMPLETE', { result: JSON.stringify(result) });
    return buildResponse(200, "${agent_name} completed.", result);

  } catch (e) {
    logEvent('${agent_name^^}_AGENT_ERROR', { error: e.message });
    return buildResponse(500, "Error in ${agent_name}Agent: " + e.message);
  }
}

/**
 * Core processing logic for ${agent_name}.
 * Keep business logic here, not in init().
 * @param {Object} payload
 * @returns {any}
 */
function _${agent_name}Agent_process(payload) {
  // Replace this stub with real logic.
  // Example: return { processed: true, inputReceived: payload };
  return null;
}
TEMPLATE

  info "Created: $agent_file"
  echo ""
  info "Next steps:"
  echo "  1. Open $agent_file and add your logic inside _${agent_name}Agent_process()"
  echo "  2. Register the route in dev-project/Router.gs:"
  echo "       case \"${action_key}\":"
  echo "         return ${agent_name}Agent_init(payload);"
  echo "  3. Deploy: ./ai-agents.sh deploy dev"
}

# =============================================================================
# FUNCTION: deploy
#
# Pushes local code to the correct GAS project via clasp.
# Dev deploys immediately. Prod requires typing 'yes-prod' as a safety gate.
# =============================================================================
deploy() {
  local target="${1:-}"
  [[ -z "$target" ]] && error "Target required. Usage: ./ai-agents.sh deploy <dev|prod>"

  case "$target" in
    dev)
      info "Deploying DEV → AI Agents Command Hub (cary.hebert@gmail.com)..."
      cd "$DEV_DIR"
      clasp push
      cd "$ROOT_DIR"
      info "DEV deployment complete."
      ;;
    prod)
      warn "You are about to push to PRODUCTION (chebert4@ebrschools.org)."
      warn "This affects live classroom workflows."
      read -rp "  Type 'yes-prod' to confirm: " confirm
      [[ "$confirm" != "yes-prod" ]] && error "Deployment cancelled."
      info "Deploying PROD → Agents-Production-Log..."
      cd "$PROD_DIR"
      clasp push
      cd "$ROOT_DIR"
      info "PROD deployment complete."
      ;;
    *)
      error "Unknown target '$target'. Use 'dev' or 'prod'."
      ;;
  esac
}

# =============================================================================
# ENTRYPOINT
# =============================================================================
main() {
  local command="${1:-help}"
  shift || true

  case "$command" in
    auth)    refresh_clasp_auth "$@" ;;
    agent)   create_agent       "$@" ;;
    deploy)  deploy             "$@" ;;
    help|*)
      echo ""
      echo "  Gateway-OS CLI — ai-agents.sh"
      echo ""
      echo "  Usage:"
      echo "    ./ai-agents.sh auth   [dev|prod]    Check/rotate clasp auth + GitHub Secret"
      echo "    ./ai-agents.sh agent  <AgentName>   Scaffold a new Agent in dev-project/agents/"
      echo "    ./ai-agents.sh deploy <dev|prod>    Push code to the target GAS project"
      echo ""
      echo "  Examples:"
      echo "    ./ai-agents.sh auth dev             # Verify dev token (auto-rotates if expired)"
      echo "    ./ai-agents.sh agent Logger          # Creates dev-project/agents/LoggerAgent.gs"
      echo "    ./ai-agents.sh deploy dev            # Push dev code to GAS"
      echo "    ./ai-agents.sh deploy prod           # Push prod code (requires 'yes-prod')"
      echo ""
      ;;
  esac
}

main "$@"
