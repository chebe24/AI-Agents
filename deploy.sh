#!/bin/bash

# =============================================================================
# AI-Agents Deploy Script
# Usage: ./deploy.sh [dev|prod]
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

# Check argument
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh [dev|prod]"
    echo ""
    echo "  dev   - Deploy to development Apps Script"
    echo "  prod  - Deploy to production Apps Script"
    exit 1
fi

ENV=$1

# Set variables based on environment
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
    print_error "Invalid environment: $ENV"
    echo "Use 'dev' or 'prod'"
    exit 1
fi

# Check project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    echo "Run ./clasp-setup.sh first"
    exit 1
fi

# Check clasp is installed
if ! command -v clasp &> /dev/null; then
    print_error "clasp not found. Install with: npm i -g @google/clasp"
    exit 1
fi

# Navigate to project
cd "$PROJECT_DIR"

# Check clasp login status
print_step "Checking clasp authentication..."
if ! clasp login --status 2>&1 | grep -q "You are logged in"; then
    print_warning "Not logged in. Running clasp login..."
    clasp login
fi

# Pull latest (to avoid conflicts)
print_step "Pulling latest from Apps Script..."
clasp pull || print_warning "Pull failed - may be first push"

# Push changes
print_step "Pushing changes to Apps Script..."
clasp push

print_success "Push complete!"

# For prod, also deploy as webapp
if [ "$ENV" = "prod" ]; then
    print_step "Creating new deployment..."
    clasp deploy --description "Deploy $(date +%Y-%m-%d_%H:%M)"
    print_success "Webapp deployed!"
    
    echo ""
    echo "View deployments with: clasp deployments"
fi

# Return to root
cd ..

# Git status reminder
print_step "Don't forget to commit!"
echo "  git add ."
echo "  git commit -m 'deploy: Update $ENV $(date +%Y-%m-%d)'"
echo "  git push"

print_success "Deploy to $ENV complete!"
