#!/bin/zsh
# ============================================================
# check-git-in-documents.sh
# Detects .git directories inside ~/Documents
# Run via: zsh ~/Developer.nosync/nexus-command/scripts/check-git-in-documents.sh
# Or scheduled via LaunchAgent: com.chebe24.gitcheck.plist
# ============================================================

set -euo pipefail

TARGET="$HOME/Documents"
LOG_FILE="$HOME/Library/Logs/git-in-documents.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Find all .git directories under ~/Documents
VIOLATIONS=$(find "$TARGET" -maxdepth 5 -type d -name ".git" 2>/dev/null || true)

if [[ -n "$VIOLATIONS" ]]; then
  echo "[$TIMESTAMP] ❌ ERROR: .git directories found under $TARGET:" | tee -a "$LOG_FILE"
  echo "$VIOLATIONS" | tee -a "$LOG_FILE"
  echo "[$TIMESTAMP] Action required: move repo to ~/Developer.nosync/" | tee -a "$LOG_FILE"

  # macOS notification
  osascript -e "display notification \"Repo found in ~/Documents — move to ~/Developer.nosync\" with title \"Git Guardrail\" subtitle \"$VIOLATIONS\""

  exit 1
else
  echo "[$TIMESTAMP] ✅ Clean — no .git directories found under $TARGET" >> "$LOG_FILE"
  exit 0
fi
