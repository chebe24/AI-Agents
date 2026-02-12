#!/bin/bash

# =============================================================================
# AI-Agents Clasp Setup Script
# Run once to initialize clasp projects for dev and prod
# =============================================================================

set -e

# Configuration - UPDATE THESE WITH YOUR EMAILS
DEV_EMAIL="cary.hebert@gmail.com"
PROD_EMAIL="chebert4@ebrschools.org"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "\n${BLUE}▶ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

echo "============================================"
echo "  AI-Agents Clasp Setup"
echo "============================================"

# Check Node.js
print_step "Checking Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Install from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js installed: $NODE_VERSION"

# Check/install clasp
print_step "Checking clasp..."
if ! command -v clasp &> /dev/null; then
    print_warning "clasp not found. Installing..."
    npm install -g @google/clasp
fi
print_success "clasp installed"

# Login to dev account
print_step "Login to DEV account ($DEV_EMAIL)"
echo "A browser will open. Log in with your DEV Google account."
read -p "Press Enter to continue..."
clasp login

# Create dev project if not exists
if [ ! -f "dev-project/.clasp.json" ]; then
    print_step "Creating DEV Apps Script project..."
    mkdir -p dev-project
    cd dev-project
    clasp create --type webapp --title "AI-Agents-Dev"
    cd ..
    print_success "Dev project created"
else
    print_success "Dev project already exists"
fi

# Prompt for prod setup
echo ""
print_step "PROD account setup"
echo "For production, you have two options:"
echo "  1) Use same account (simpler)"
echo "  2) Use different account (more secure)"
read -p "Use same account for prod? (y/n): " same_account

if [[ "$same_account" =~ ^[Nn]$ ]]; then
    print_step "Login to PROD account ($PROD_EMAIL)"
    echo "A browser will open. Log in with your PROD Google account."
    read -p "Press Enter to continue..."
    clasp logout
    clasp login
fi

# Create prod project if not exists
if [ ! -f "prod-project/.clasp.json" ]; then
    print_step "Creating PROD Apps Script project..."
    mkdir -p prod-project
    cd prod-project
    clasp create --type webapp --title "AI-Agents-Prod"
    cd ..
    print_success "Prod project created"
else
    print_success "Prod project already exists"
fi

# Create template Code.gs if missing
if [ ! -f "dev-project/Code.gs" ]; then
    print_step "Creating template Code.gs..."
    cat > dev-project/Code.gs << 'EOF'
/**
 * AI-Agents Main Code
 * Environment: Development
 */

// Account verification - prevents wrong-account execution
function checkAccount() {
  const expected = 'dev@yourdomain.com'; // UPDATE THIS
  const actual = Session.getActiveUser().getEmail();
  if (actual !== expected) {
    throw new Error(`Wrong account! Expected ${expected}, got ${actual}`);
  }
  return true;
}

// Web app entry point
function doGet(e) {
  checkAccount();
  return ContentService.createTextOutput('Dev ready - ' + new Date());
}

function doPost(e) {
  checkAccount();
  const data = JSON.parse(e.postData.contents);
  // Process data here
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    received: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function
function testSetup() {
  Logger.log('Account check: ' + checkAccount());
  Logger.log('Setup complete!');
}
EOF
    print_success "Template Code.gs created"
fi

# Copy to prod
if [ ! -f "prod-project/Code.gs" ]; then
    cp dev-project/Code.gs prod-project/Code.gs
    # Update account check for prod
    sed -i '' "s/dev@yourdomain.com/prod@yourdomain.com/g" prod-project/Code.gs 2>/dev/null || \
    sed -i "s/dev@yourdomain.com/prod@yourdomain.com/g" prod-project/Code.gs
    print_success "Prod Code.gs created"
fi

# Git init if missing
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
echo "  1. Update emails in deploy.sh and Code.gs"
echo "  2. Run: ./deploy.sh dev"
echo "  3. Test in Apps Script editor"
echo "  4. Run: ./deploy.sh prod"
echo ""
