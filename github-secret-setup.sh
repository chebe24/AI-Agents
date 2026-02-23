#!/bin/bash

# =============================================================================
# GitHub Secret Setup — Store clasp credentials as GitHub Secret
# Run from: /Users/caryhebert/Documents/02_Projects/AI-Agents
# Usage: bash github-secret-setup.sh
# =============================================================================

REPO="chebe24/AI-Agents"
SECRET_NAME="CLASPRC_JSON"
CLASPRC="$HOME/.clasprc.json"

echo "============================================"
echo "  GitHub Secret Setup — clasp credentials"
echo "============================================"

# Step 1: Check .clasprc.json exists
echo ""
echo "▶ Step 1: Checking for ~/.clasprc.json..."
if [ ! -f "$CLASPRC" ]; then
  echo "✗ Not found. Run 'clasp login' first."
  exit 1
fi
echo "✓ Found ~/.clasprc.json"

# Step 2: Check gh CLI is installed
echo ""
echo "▶ Step 2: Checking GitHub CLI (gh)..."
if ! command -v gh &> /dev/null; then
  echo "✗ GitHub CLI not installed."
  echo "  Install it with: brew install gh"
  echo "  Then run: gh auth login"
  exit 1
fi
echo "✓ GitHub CLI found"

# Step 3: Check gh is authenticated
echo ""
echo "▶ Step 3: Checking GitHub CLI authentication..."
if ! gh auth status &> /dev/null; then
  echo "✗ Not logged into GitHub CLI."
  echo "  Run: gh auth login"
  exit 1
fi
echo "✓ GitHub CLI authenticated"

# Step 4: Preview what will be uploaded (masked)
echo ""
echo "▶ Step 4: Preview of ~/.clasprc.json (token values masked):"
cat "$CLASPRC" | sed 's/"token":"[^"]*"/"token":"****"/g' | sed 's/"refresh_token":"[^"]*"/"refresh_token":"****"/g' | sed 's/"access_token":"[^"]*"/"access_token":"****"/g'

# Step 5: Confirm
echo ""
read -p "Upload this to GitHub Secrets as '$SECRET_NAME'? (y/n): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Step 6: Upload secret
echo ""
echo "▶ Step 5: Uploading secret to $REPO..."
gh secret set "$SECRET_NAME" --repo "$REPO" < "$CLASPRC"

if [ $? -eq 0 ]; then
  echo ""
  echo "============================================"
  echo "✓ Secret '$SECRET_NAME' saved to GitHub!"
  echo "  View at: https://github.com/$REPO/settings/secrets/actions"
  echo "============================================"
else
  echo "✗ Upload failed. Check your GitHub permissions."
  exit 1
fi
