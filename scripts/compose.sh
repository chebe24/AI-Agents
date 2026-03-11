#!/bin/bash
# =============================================================================
# compose.sh - Gateway-OS Composition Build Script
# =============================================================================
# Assembles agent blocks into deployable GAS compositions
#
# Usage:
#   ./scripts/compose.sh <composition-name>
#
# Example:
#   ./scripts/compose.sh gateway-os-prod
#   ./scripts/compose.sh gateway-os-dev
#   ./scripts/compose.sh nexus-ai-inventory
#
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# CONFIGURATION
# =============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BLOCKS_DIR="$REPO_ROOT/blocks"
COMPOSITIONS_DIR="$REPO_ROOT/compositions"

# =============================================================================
# FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC}  $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC}    $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC}  $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        log_info  "Install with: brew install jq"
        exit 1
    fi
}

# Validate composition name
validate_composition() {
    local comp=$1
    if [ -z "$comp" ]; then
        log_error "No composition name provided"
        echo ""
        echo "Usage: $0 <composition-name>"
        echo ""
        echo "Available compositions:"
        ls -1 "$COMPOSITIONS_DIR" | grep -v "README"
        exit 1
    fi

    if [ ! -d "$COMPOSITIONS_DIR/$comp" ]; then
        log_error "Composition '$comp' not found"
        echo ""
        echo "Available compositions:"
        ls -1 "$COMPOSITIONS_DIR" | grep -v "README"
        exit 1
    fi

    if [ ! -f "$COMPOSITIONS_DIR/$comp/manifest.json" ]; then
        log_error "manifest.json not found for '$comp'"
        exit 1
    fi
}

# Clean composition directory
clean_composition() {
    local comp_dir=$1
    log_info "Cleaning previous build..."

    # Remove all .gs files except manifest.json and README.md
    find "$comp_dir" -type f \( -name "*.gs" -o -name ".clasp.json" -o -name "appsscript.json" \) -delete

    log_success "Cleaned"
}

# Copy core blocks
copy_core_blocks() {
    local comp_dir=$1
    local manifest=$2

    log_info "Copying core blocks..."

    local core_blocks=$(jq -r '.blocks.core[]' "$manifest")
    local count=0

    for block in $core_blocks; do
        local block_file="$BLOCKS_DIR/core/$block/${block}Agent.gs"

        # Handle special case for SecurityAgent, Router, Utilities (no "Agent" suffix)
        if [ "$block" = "Security" ]; then
            block_file="$BLOCKS_DIR/core/$block/SecurityAgent.gs"
        elif [ "$block" = "Router" ]; then
            block_file="$BLOCKS_DIR/core/$block/Router.gs"
        elif [ "$block" = "Utilities" ]; then
            block_file="$BLOCKS_DIR/core/$block/Utilities.gs"
        fi

        if [ -f "$block_file" ]; then
            cp "$block_file" "$comp_dir/"
            log_success "  ✓ $block"
            ((count++))
        else
            log_warn "  ✗ $block (not found: $block_file)"
        fi
    done

    log_info "Core blocks copied: $count"
}

# Copy agent blocks
copy_agent_blocks() {
    local comp_dir=$1
    local manifest=$2

    log_info "Copying agent blocks..."

    local agent_blocks=$(jq -r '.blocks.agents[]' "$manifest" 2>/dev/null || echo "")
    local count=0

    if [ -z "$agent_blocks" ]; then
        log_info "No agent blocks specified"
        return
    fi

    for block in $agent_blocks; do
        local block_file="$BLOCKS_DIR/agents/$block/${block}.gs"

        if [ -f "$block_file" ]; then
            cp "$block_file" "$comp_dir/"
            log_success "  ✓ $block"
            ((count++))
        else
            log_warn "  ✗ $block (not found: $block_file)"
        fi
    done

    log_info "Agent blocks copied: $count"
}

# Copy additional files
copy_additional_files() {
    local comp_dir=$1
    local manifest=$2
    local comp_name=$3

    log_info "Copying additional files..."

    local add_files=$(jq -r '.additional_files[]' "$manifest" 2>/dev/null || echo "")
    local count=0

    if [ -z "$add_files" ]; then
        log_info "No additional files specified"
        return
    fi

    # Determine source directory (prod-project or dev-project)
    local source_dir="$REPO_ROOT/prod-project"
    if [[ "$comp_name" == *"dev"* ]]; then
        source_dir="$REPO_ROOT/dev-project"
    fi

    for file in $add_files; do
        local file_path="$source_dir/$file"

        if [ -f "$file_path" ]; then
            cp "$file_path" "$comp_dir/"
            log_success "  ✓ $file"
            ((count++))
        else
            log_warn "  ✗ $file (not found: $file_path)"
        fi
    done

    log_info "Additional files copied: $count"
}

# Generate .clasp.json
generate_clasp_json() {
    local comp_dir=$1
    local manifest=$2

    log_info "Generating .clasp.json..."

    local script_id=$(jq -r '.clasp.script_id' "$manifest")
    local root_dir=$(jq -r '.clasp.root_dir' "$manifest")

    cat > "$comp_dir/.clasp.json" <<EOF
{
  "scriptId": "$script_id",
  "rootDir": "$root_dir"
}
EOF

    log_success "Created .clasp.json"
}

# Generate appsscript.json
generate_appsscript_json() {
    local comp_dir=$1
    local manifest=$2

    log_info "Generating appsscript.json..."

    local timezone=$(jq -r '.clasp.timezone' "$manifest")

    cat > "$comp_dir/appsscript.json" <<EOF
{
  "timeZone": "$timezone",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
EOF

    log_success "Created appsscript.json"
}

# Print summary
print_summary() {
    local comp_name=$1
    local comp_dir=$2
    local manifest=$3

    echo ""
    echo "═══════════════════════════════════════════════════════════"
    log_success "Composition built successfully!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    log_info "Composition: $comp_name"
    log_info "Location:    $comp_dir"
    echo ""
    log_info "Files assembled:"
    ls -1 "$comp_dir"/*.gs 2>/dev/null | while read file; do
        echo "  • $(basename "$file")"
    done
    echo ""
    log_info "Next steps:"
    echo "  1. cd $comp_dir"
    echo "  2. clasp push"
    echo "  3. Configure Script Properties in Apps Script editor"
    echo ""

    local script_props=$(jq -r '.script_properties.required[]' "$manifest" 2>/dev/null)
    if [ -n "$script_props" ]; then
        log_info "Required Script Properties:"
        echo "$script_props" | while read prop; do
            echo "  • $prop"
        done
        echo ""
    fi
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    local composition=$1

    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  Gateway-OS Composition Builder"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    # Checks
    check_jq
    validate_composition "$composition"

    local comp_dir="$COMPOSITIONS_DIR/$composition"
    local manifest="$comp_dir/manifest.json"

    log_info "Building composition: $composition"
    echo ""

    # Build steps
    clean_composition "$comp_dir"
    copy_core_blocks "$comp_dir" "$manifest"
    copy_agent_blocks "$comp_dir" "$manifest"
    copy_additional_files "$comp_dir" "$manifest" "$composition"
    generate_clasp_json "$comp_dir" "$manifest"
    generate_appsscript_json "$comp_dir" "$manifest"

    # Summary
    print_summary "$composition" "$comp_dir" "$manifest"
}

# Run main with provided argument
main "$1"
