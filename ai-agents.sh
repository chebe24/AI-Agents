#!/usr/bin/env bash
# =============================================================================
# ai-agents.sh — Gateway-OS Deployment CLI
# Project: AI-Agents | Author: Cary | Updated: 2026-02
# =============================================================================
set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="$ROOT_DIR/dev-project"
PROD_DIR="$ROOT_DIR/prod-project"
AGENTS_DIR="$DEV_DIR/agents"

# ── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# =============================================================================
# FUNCTION: refresh_clasp_auth
# =============================================================================
refresh_clasp_auth() {
  local target="${1:-dev}"
  info "Checking clasp authentication for: $target..."

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
  info "Secret rotated successfully."

  cd "$ROOT_DIR"
}

# =============================================================================
# FUNCTION: create_agent
# Scaffolds a new Agent file in dev-project/agents/ with standard boilerplate.
# Usage: ./ai-agents.sh agent Journal
# Creates: dev-project/agents/JournalAgent.gs
# =============================================================================
create_agent() {
  local agent_name="${1:-}"
  [[ -z "$agent_name" ]] && error "Agent name required. Usage: ./ai-agents.sh agent <Name>"

  # Normalize: strip special characters, capitalize first letter
  agent_name="$(echo "$agent_name" | sed 's/[^a-zA-Z0-9]//g')"
  agent_name="${agent_name^}"

  local agent_file="$AGENTS_DIR/${agent_name}Agent.gs"
  mkdir -p "$AGENTS_DIR"

  [[ -f "$agent_file" ]] && error "Agent already exists: $agent_file"

  info "Scaffolding new Agent: ${agent_name}Agent.gs ..."

  cat > "$agent_file" <<TEMPLATE
/**
 * @file ${agent_name}Agent.gs
 * @description Gateway-OS Agent — ${agent_name} automation handler.
 *
 * @author      Cary
 * @created     $(date +%Y-%m-%d)
 * @version     1.0.0
 *
 * ROUTER CONTRACT:
 *   The main Router calls ${agent_name}Agent_init() when action === "${agent_name,,}"
 *   Always return: { status: "ok"|"error", message: String, data?: Any }
 */

/**
 * Entry point called by the Router for "${agent_name,,}" actions.
 * @param {Object} payload - The parsed request payload from doPost.
 * @returns {{ status: string, message: string, data?: any }}
 */
function ${agent_name}Agent_init(payload) {
  try {
    Logger.log("[${agent_name}Agent] Received payload: " + JSON.stringify(payload));

    // ── TODO: Implement ${agent_name} logic below ──────────────────────────
    var result = _${agent_name}Agent_process(payload);
    // ────────────────────────────────────────────────────────────────────

    return { status: "ok", message: "${agent_name} completed.", data: result };

  } catch (e) {
    Logger.log("[${agent_name}Agent] ERROR: " + e.message);
    return { status: "error", message: e.message };
  }
}

/**
 * Core processing logic for ${agent_name}.
 * @param {Object} payload
 * @returns {any}
 */
function _${agent_name}Agent_process(payload) {
  // Replace this stub with real logic.
  return null;
}
TEMPLATE

  info "Created: $agent_file"
  info "Next: Register '${agent_name,,}' as a route in dev-project/Router.gs"
}

# =============================================================================
# FUNCTION: deploy
# =============================================================================
deploy() {
  local target="${1:-}"
  [[ -z "$target" ]] && error "Target required. Usage: ./ai-agents.sh deploy <dev|prod>"

  case "$target" in
    dev)
      info "Deploying to DEV (AI Agents Command Hub)..."
      cd "$DEV_DIR"
      clasp push
      info "DEV deployment complete."
      ;;
    prod)
      warn "You are about to push to PRODUCTION."
      read -rp "  Type 'yes-prod' to confirm: " confirm
      [[ "$confirm" != "yes-prod" ]] && error "Deployment cancelled."
      info "Deploying to PROD (Agents-Production-Log)..."
      cd "$PROD_DIR"
      clasp push
      info "PROD deployment complete."
      ;;
    *)
      error "Unknown target '$target'. Use 'dev' or 'prod'."
      ;;
  esac

  cd "$ROOT_DIR"
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
      echo "    ./ai-agents.sh auth   [dev|prod]   Check/rotate clasp auth + GitHub Secret"
      echo "    ./ai-agents.sh agent  <AgentName>  Scaffold a new Agent file in dev-project/agents/"
      echo "    ./ai-agents.sh deploy <dev|prod>   Push code to the target GAS project"
      echo ""
      ;;
  esac
}

main "$@"
