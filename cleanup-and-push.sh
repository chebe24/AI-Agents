#!/bin/bash
# AI-Agents Cleanup + Push to GitHub
# Run from: /Users/caryhebert/Documents/02_Projects/AI-Agents
# Usage: bash cleanup-and-push.sh

set -e

echo "▶ Step 1: Remove duplicate files"
rm -f "README 3.md" "README 4.md" "ROADMAP 2.md" "deploy 2.sh"
echo "  ✓ Duplicates removed"

echo "▶ Step 2: Create scripts/ folder and move Code.gs"
mkdir -p scripts
cp "scripts:Code.gs" "scripts/Code.gs"
rm "scripts:Code.gs"
echo "  ✓ scripts/Code.gs created (colon-named file removed)"

echo "▶ Step 3: Git - stage all changes"
git add -A

echo "▶ Step 4: Show what will be committed"
git status

echo ""
read -p "Looks good? Commit and push? (y/n): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted. Changes are staged but not committed."
  exit 0
fi

echo "▶ Step 5: Commit"
git commit -m "refactor: clean up repo structure for Gemini handoff

- Remove duplicate files (README 3.md, README 4.md, ROADMAP 2.md, deploy 2.sh)
- Fix scripts:Code.gs → scripts/Code.gs (invalid filename)
- Update README.md with full project overview
- Update CLAUDE.md with AI assistant instructions and current status"

echo "▶ Step 6: Push to GitHub"
git push origin main

echo ""
echo "✓ Done! Repo is clean and pushed."
echo "  Share this URL with Gemini: https://github.com/chebe24/AI-Agents"
