#!/usr/bin/env bash
# =============================================================================
# ai-agents.sh — Gateway-OS Deployment CLI
# Project : Gateway-OS / AI-Agents
# Author  : Cary Hebert
# Updated : 2026-03
#
# Commands:
#   auth   [dev|prod]    Check / rotate clasp OAuth + GitHub Secret
#   gem    <GemName>     Scaffold a new Gem file in dev-project/gems/
#   deploy <dev|prod>    Push code to target GAS project via clasp
#   help                 Show this message
# =============================================================================
set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="$ROOT_DIR/dev-project"
PROD_DIR="$ROOT_DIR/prod-project"
GEMS_DIR="$DEV_DIR/gems"

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
# FUNCTION: create_gem
#
# Scaffolds a new Gem file in dev-project/gems/ with standard boilerplate.
# A "Gem" is a self-contained automation handler that plugs into Router.gs.
#
# Usage : ./ai-agents.sh gem Journal
# Creates: dev-project/gems/JournalGem.gs
#
# After creation, register the route in dev-project/Router.gs:
#   case "journal":
#     return JournalGem_init(payload);
# =============================================================================
create_gem() {
  local gem_name="${1:-}"
  [[ -z "$gem_name" ]] && error "Gem name required. Usage: ./ai-agents.sh gem <Name>"

  # Normalize: strip non-alphanumeric, capitalize first letter
  gem_name="$(echo "$gem_name" | sed 's/[^a-zA-Z0-9]//g')"
  gem_name="${gem_name^}"

  local gem_file="$GEMS_DIR/${gem_name}Gem.gs"
  mkdir -p "$GEMS_DIR"

  [[ -f "$gem_file" ]] && error "Gem already exists: $gem_file"

  local action_key
  action_key="$(echo "$gem_name" | tr '[:upper:]' '[:lower:]')"

  info "Scaffolding new Gem: ${gem_name}Gem.gs ..."

  cat > "$gem_file" <<TEMPLATE
/**
 * @file      ${gem_name}Gem.gs
 * @author    Cary Hebert
 * @created   $(date +%Y-%m-%d)
 * @version   1.0.0
 *
 * Gateway-OS Gem — handles all "${action_key}" webhook actions.
 *
 * ROUTER CONTRACT
 *   Router.gs calls ${gem_name}Gem_init(payload) when payload.action === "${action_key}"
 *   Return shape: { status: "ok"|"error", message: String, data?: Any }
 *
 * REGISTRATION (add to dev-project/Router.gs switch statement):
 *   case "${action_key}":
 *     return ${gem_name}Gem_init(payload);
 */

/**
 * Entry point called by the Router.
 * @param {Object} payload - Parsed JSON from the incoming webhook POST body.
 * @returns {{ status: string, message: string, data?: any }}
 */
function ${gem_name}Gem_init(payload) {
  try {
    logEvent('${gem_name^^}_GEM_START', { payload: JSON.stringify(payload) });

    // ── TODO: Implement ${gem_name} logic below ──────────────────────────
    var result = _${gem_name}Gem_process(payload);
    // ────────────────────────────────────────────────────────────────────

    logEvent('${gem_name^^}_GEM_COMPLETE', { result: JSON.stringify(result) });
    return buildResponse(200, "${gem_name} completed.", result);

  } catch (e) {
    logEvent('${gem_name^^}_GEM_ERROR', { error: e.message });
    return buildResponse(500, "Error in ${gem_name}Gem: " + e.message);
  }
}

/**
 * Core processing logic for ${gem_name}.
 * Keep business logic here, not in init().
 * @param {Object} payload
 * @returns {any}
 */
function _${gem_name}Gem_process(payload) {
  // Replace this stub with real logic.
  // Example: return { processed: true, inputReceived: payload };
  return null;
}
TEMPLATE

  info "Created: $gem_file"
  echo ""
  info "Next steps:"
  echo "  1. Open $gem_file and add your logic inside _${gem_name}Gem_process()"
  echo "  2. Register the route in dev-project/Router.gs:"
  echo "       case \"${action_key}\":"
  echo "         return ${gem_name}Gem_init(payload);"
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
    gem)     create_gem         "$@" ;;
    deploy)  deploy             "$@" ;;
    help|*)
      echo ""
      echo "  Gateway-OS CLI — ai-agents.sh"
      echo ""
      echo "  Usage:"
      echo "    ./ai-agents.sh auth   [dev|prod]   Check/rotate clasp auth + GitHub Secret"
      echo "    ./ai-agents.sh gem    <GemName>    Scaffold a new Gem in dev-project/gems/"
      echo "    ./ai-agents.sh deploy <dev|prod>   Push code to the target GAS project"
      echo ""
      echo "  Examples:"
      echo "    ./ai-agents.sh auth dev            # Verify dev token (auto-rotates if expired)"
      echo "    ./ai-agents.sh gem Journal          # Creates dev-project/gems/JournalGem.gs"
      echo "    ./ai-agents.sh deploy dev           # Push dev code to GAS"
      echo "    ./ai-agents.sh deploy prod          # Push prod code (requires 'yes-prod')"
      echo ""
      ;;
  esac
}

main "$@"
