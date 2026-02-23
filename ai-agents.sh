#!/bin/bash
# =============================================================================
# AI-Agents Master Script
# Usage:
#   ./ai-agents.sh setup        - Initialize clasp projects (run once)
#   ./ai-agents.sh deploy dev   - Deploy to development
#   ./ai-agents.sh deploy prod  - Deploy to production
# =============================================================================

set -e

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
DEV_EMAIL="cary.hebert@gmail.com"
PROD_EMAIL="chebert4@ebrschools.org"

DEV_SCRIPT_ID="1rluMr-PxAZzyNbXgI4lXPIyQC7c8kz3m_C7ytWWWNsNwF9g47A9H8VqG"
PROD_SCRIPT_ID="1y9Lk6g03UMhptqaPJOHews6X8iqYQsbLGqCIFeTI_VgNca8fcP-KAfi0"

# ─── COLORS ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step()    { echo -e "\n${BLUE}▶ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }

# ─── USAGE ────────────────────────────────────────────────────────────────────
usage() {
  echo ""
  echo "Usage: ./ai-agents.sh [command] [options]"
  echo ""
  echo "  setup            Initialize clasp projects (run once)"
  echo "  deploy dev       Deploy to development Apps Script"
  echo "  deploy prod      Deploy to production Apps Script"
  echo ""
  exit 1
}

# ─── SHARED: CHECK CLASP ──────────────────────────────────────────────────────
check_clasp() {
  if ! command -v clasp &> /dev/null; then
    print_error "clasp not found. Install with: npm i -g @google/clasp"
    exit 1
  fi
  print_success "clasp is installed"
}

# ─── SHARED: LOGIN HELPER ─────────────────────────────────────────────────────
login_to_account() {
  local account=$1
  echo ""
  print_step "Logging into $account"
  echo "A browser will open. Make sure you select: $account"
  read -p "Press Enter to continue..."
  clasp logout 2>/dev/null || true
  clasp login
  print_success "Logged in successfully"
}

# ─── COMMAND: SETUP ───────────────────────────────────────────────────────────
cmd_setup() {
  echo "============================================"
  echo "         AI-Agents Setup"
  echo "============================================"

  # Check Node.js
  print_step "Checking Node.js..."
  if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Install from https://nodejs.org"
    exit 1
  fi
  print_success "Node.js installed: $(node -v)"

  # Check/install clasp
  print_step "Checking clasp..."
  if ! command -v clasp &> /dev/null; then
    print_warning "clasp not found. Installing..."
    npm install -g @google/clasp
  fi
  print_success "clasp is ready"

  # Enable Apps Script API reminder
  echo ""
  print_warning "IMPORTANT: Before continuing, make sure you have enabled"
  print_warning "the Apps Script API for BOTH Google accounts at:"
  print_warning "https://script.google.com/home/usersettings"
  read -p "Have you done this? (y/n): " api_enabled
  if [[ ! "$api_enabled" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please enable the API first, then run setup again."
    exit 0
  fi

  # ── DEV PROJECT SETUP ──
  login_to_account "$DEV_EMAIL"

  if [ ! -d "dev-project" ]; then
    mkdir -p dev-project
  fi

  if [ ! -f "dev-project/.clasp.json" ]; then
    print_step "Creating DEV Apps Script project..."
    cd dev-project
    clasp create --title "AI-Agents-Dev"
    cd ..
    print_success "Dev project created"
  else
    print_success "Dev project already exists"
  fi

  # Create template Code.gs for dev
  if [ ! -f "dev-project/Code.gs" ]; then
    print_step "Creating template Code.gs for dev..."
    cat > dev-project/Code.gs << 'EOF'
/**
 * AI-Agents Main Code
 * Environment: Development
 */

function checkAccount() {
  const expected = 'cary.hebert@gmail.com';
  const actual = Session.getActiveUser().getEmail();
  if (actual !== expected) {
    throw new Error(`Wrong account! Expected ${expected}, got ${actual}`);
  }
  return true;
}

function doGet(e) {
  checkAccount();
  return ContentService.createTextOutput('Dev ready - ' + new Date());
}

function doPost(e) {
  checkAccount();
  const data = JSON.parse(e.postData.contents);
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    received: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function testSetup() {
  Logger.log('Account check: ' + checkAccount());
  Logger.log('Setup complete!');
}
EOF
    print_success "Dev Code.gs created"
  fi

  # Push dev
  print_step "Pushing dev project..."
  cd dev-project
  clasp push
  cd ..
  print_success "Dev project pushed!"

  # ── PROD PROJECT SETUP ──
  login_to_account "$PROD_EMAIL"

  if [ ! -d "prod-project" ]; then
    mkdir -p prod-project
  fi

  if [ ! -f "prod-project/.clasp.json" ]; then
    print_step "Creating PROD Apps Script project..."
    cd prod-project
    clasp create --title "AI-Agents-Prod"
    cd ..
    print_success "Prod project created"
  else
    print_success "Prod project already exists"
  fi

  # Create Code.gs for prod
  if [ ! -f "prod-project/Code.gs" ]; then
    print_step "Creating template Code.gs for prod..."
    cp dev-project/Code.gs prod-project/Code.gs
    sed -i '' "s/cary.hebert@gmail.com/chebert4@ebrschools.org/g" \
      prod-project/Code.gs 2>/dev/null || \
    sed -i "s/cary.hebert@gmail.com/chebert4@ebrschools.org/g" \
      prod-project/Code.gs
    print_success "Prod Code.gs created"
  fi

  # Push prod
  print_step "Pushing prod project..."
  cd prod-project
  clasp push
  cd ..
  print_success "Prod project pushed!"

  # Git init
  if [ ! -d ".git" ]; then
    print_step "Initializing Git..."
    git init
    git add .
    git commit -m "Initial commit: AI-Agents project setup"
    print_success "Git initialized"
  fi

  echo ""
  echo "============================================"
  print_success "Setup complete!"
  echo "============================================"
  echo ""
  echo "Next steps:"
  echo "  ./ai-agents.sh deploy dev   ← test first"
  echo "  ./ai-agents.sh deploy prod  ← when ready"
  echo ""
}

# ─── COMMAND: DEPLOY ──────────────────────────────────────────────────────────
cmd_deploy() {
  ENV=$1

  if [ -z "$ENV" ]; then
    print_error "Missing environment. Use: deploy dev OR deploy prod"
    usage
  fi

  if [ "$ENV" = "dev" ]; then
    PROJECT_DIR="dev-project"
    USER_EMAIL="$DEV_EMAIL"
    print_step "Deploying to DEVELOPMENT"

  elif [ "$ENV" = "prod" ]; then
    PROJECT_DIR="prod-project"
    USER_EMAIL="$PROD_EMAIL"
    print_step "Deploying to PRODUCTION"
    print_warning "This will update the live webapp!"
    read -p "Continue? (y/n): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "Aborted."
      exit 0
    fi

  else
    print_error "Invalid environment: $ENV (use dev or prod)"
    exit 1
  fi

  # Verify project folder exists
  if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project folder not found: $PROJECT_DIR"
    echo "Run: ./ai-agents.sh setup"
    exit 1
  fi

  check_clasp

  # Log into the right account
  login_to_account "$USER_EMAIL"

  cd "$PROJECT_DIR"

  # Push
  print_step "Pushing changes to Apps Script..."
  clasp push
  print_success "Push complete!"

  # Deploy (create a new version)
  print_step "Creating deployment..."
  clasp deploy --description "Deploy $(date '+%Y-%m-%d %H:%M')"
  print_success "Deployed!"

  cd ..

  # Git reminder
  echo ""
  print_step "Don't forget to commit to GitHub!"
  echo "  git add ."
  echo "  git commit -m 'deploy: Update $ENV $(date +%Y-%m-%d)'"
  echo "  git push"
  echo ""
  print_success "Deploy to $ENV complete!"
}

# ─── ROUTER ───────────────────────────────────────────────────────────────────
COMMAND=$1

case "$COMMAND" in
  setup)
    cmd_setup
    ;;
  deploy)
    cmd_deploy "$2"
    ;;
  *)
    print_error "Unknown command: $COMMAND"
    usage
    ;;
esac
