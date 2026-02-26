#!/bin/bash
# deploy.sh — AI-Agents master deploy script
# Accounts: DEV = cary.hebert@gmail.com | PROD = chebert4@ebrschools.org

refresh_clasp_auth() {
  local ENV=${1:-dev}
  echo ""
  echo "▶ Checking clasp session for: $ENV"

  if ! clasp list &>/dev/null; then
    echo "⚠️  Token expired or invalid. Re-authenticating..."
    clasp logout
    clasp login --no-localhost
    echo ""
    echo "▶ Previewing new token (values masked for security):"

    cat ~/.clasprc.json | sed 's/"refresh_token": ".*"/"refresh_token": "***MASKED***"/g' \
                        | sed 's/"access_token": ".*"/"access_token": "***MASKED***"/g' \
                        | sed 's/"client_secret": ".*"/"client_secret": "***MASKED***"/g'

    echo ""
    read -p "Upload fresh token to GitHub Secrets as CLASDEV_JSON? (y/n): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      gh secret set CLASDEV_JSON --repo chebe24/AI-Agents < ~/.clasprc.json
      echo "✅ GitHub Secret updated."
    else
      echo "Skipped GitHub upload. Token valid locally only."
    fi
  else
    echo "✅ Session valid. No action needed."
  fi
}

create_appscript() {
  local SCRIPT_NAME=$1

  if [ -z "$SCRIPT_NAME" ]; then
    echo "Usage: create_appscript <ScriptName>"
    exit 1
  fi

  local TARGET="dev-project/${SCRIPT_NAME}.gs"

  if [ -f "$TARGET" ]; then
    echo "⚠️  $TARGET already exists. Aborting to prevent overwrite."
    exit 1
  fi

  cat <<GSEOF > "$TARGET"
/**
 * @Script: ${SCRIPT_NAME}
 * @Created: $(date +%Y-%m-%d)
 * @Author: cary.hebert@gmail.com (DEV)
 * @Status: Development
 * @Description: TODO — describe what this script does
 *
 * DEPLOY FLOW:
 *   1. Edit and test here in dev-project/
 *   2. Run: ./deploy.sh dev
 *   3. Test in Apps Script editor
 *   4. Run: ./deploy.sh prod (after confirmation)
 */

function ${SCRIPT_NAME}_init() {
  const account = Session.getActiveUser().getEmail();
  console.log("${SCRIPT_NAME} initialized by: " + account);
  // TODO: Add your logic here
}
GSEOF

  echo "✅ Created: $TARGET"
  echo "Next: ./deploy.sh dev  →  test in Apps Script editor"

  git add "$TARGET"
  echo "✅ Staged in git. Commit after testing: git commit -m 'feat: Add ${SCRIPT_NAME}'"
}

# ── Main ────────────────────────────────────────────────────────────────────
ENV=$1

if [ "$ENV" = "dev" ]; then
  echo "▶ Deploying to DEV..."
  cd dev-project
  clasp push
  cd ..
  echo "✅ Dev deploy complete."
elif [ "$ENV" = "prod" ]; then
  read -p "⚠️  Deploy to PROD? This affects live project. (y/n): " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    echo "▶ Deploying to PROD..."
    cd prod-project
    clasp push
    cd ..
    echo "✅ Prod deploy complete."
  else
    echo "Aborted."
  fi
else
  echo "Usage: ./deploy.sh dev|prod"
fi
