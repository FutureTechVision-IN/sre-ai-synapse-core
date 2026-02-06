#!/bin/bash

################################################################################
# Installation Script for Frontend Dashboard
# Purpose: Install and configure dashboard with all dependencies
################################################################################

set -o pipefail

# Configuration
INSTALL_LOG="${HOME}/.dashboard-logs/install.log"
APP_ROOT="/Users/bipbabu/Library/CloudStorage/OneDrive-Cisco/Personal/Future Tech Vision/Future Tech Vision AI/GitHub/sre-synapse"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$INSTALL_LOG" 2>/dev/null
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    echo "[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$INSTALL_LOG" 2>/dev/null
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[WARNING] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$INSTALL_LOG" 2>/dev/null
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" >&2
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$INSTALL_LOG" 2>/dev/null
}

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Frontend Dashboard Installation Script                 ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_help() {
    cat <<EOF
Usage: install.sh [OPTIONS]

Options:
    --skip-deps    Skip npm dependency installation
    --help         Show this help message

Examples:
    ./install.sh              # Full installation
    ./install.sh --skip-deps  # Skip npm install (use existing node_modules)

EOF
}

# ============================================================================
# INSTALLATION FUNCTIONS
# ============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js v16 or later."
        return 1
    fi
    
    local node_version=$(node --version)
    log_success "Node.js $node_version found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm v7 or later."
        return 1
    fi
    
    local npm_version=$(npm --version)
    log_success "npm v$npm_version found"
    
    return 0
}

create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "${HOME}/.dashboard-logs"
    mkdir -p "${HOME}/.dashboard-cache"
    
    log_success "Directories created"
    return 0
}

install_dependencies() {
    local skip_deps=$1
    
    if [[ "$skip_deps" == true ]]; then
        log_info "Skipping npm install (--skip-deps flag set)"
        return 0
    fi
    
    log_info "Installing npm dependencies..."
    
    cd "$APP_ROOT" || {
        log_error "Failed to change directory to $APP_ROOT"
        return 1
    }
    
    if [[ -d "node_modules" ]]; then
        log_warning "node_modules already exists, skipping fresh install"
        return 0
    fi
    
    npm install --legacy-peer-deps >> "$INSTALL_LOG" 2>&1
    if [[ $? -ne 0 ]]; then
        log_error "npm install failed. Check $INSTALL_LOG for details."
        return 1
    fi
    
    log_success "Dependencies installed successfully"
    return 0
}

verify_installation() {
    log_info "Verifying installation..."
    
    cd "$APP_ROOT" || {
        log_error "Failed to change directory"
        return 1
    }
    
    # Check node_modules
    if [[ ! -d "node_modules" ]]; then
        log_error "node_modules directory not found"
        return 1
    fi
    
    # Check package.json
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found"
        return 1
    fi
    
    # Check index.html
    if [[ ! -f "index.html" ]]; then
        log_error "index.html not found"
        return 1
    fi
    
    # Check vite config
    if [[ ! -f "vite.config.ts" ]]; then
        log_error "vite.config.ts not found"
        return 1
    fi
    
    log_success "All critical files verified"
    return 0
}

create_config_files() {
    log_info "Creating configuration files..."
    
    # Create .env if not exists
    if [[ ! -f "$APP_ROOT/.env.local" ]]; then
        cat > "$APP_ROOT/.env.local" << 'ENVEOF'
VITE_PORT=3000
VITE_HOST=localhost
NODE_ENV=development
ENVEOF
        log_success ".env.local created"
    else
        log_info ".env.local already exists"
    fi
    
    return 0
}

print_summary() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  Installation Complete                                   ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Installation Summary:"
    echo -e "  ✓ Prerequisites verified"
    echo -e "  ✓ Directories created"
    echo -e "  ✓ Dependencies installed"
    echo -e "  ✓ Configuration files created"
    echo ""
    echo -e "  Installation Log: $INSTALL_LOG"
    echo ""
    echo -e "  ${YELLOW}Next Steps:${NC}"
    echo -e "  1. Start dashboard: ./scripts/startup.sh --dev"
    echo -e "  2. Visit: http://localhost:3000/"
    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    local skip_deps=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                skip_deps=true
                shift
                ;;
            --help)
                print_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done
    
    # Create log directory
    mkdir -p "$(dirname "$INSTALL_LOG")"
    
    print_header
    log_info "Starting dashboard installation..."
    
    # Run installation steps
    check_prerequisites || exit 1
    create_directories || exit 1
    install_dependencies "$skip_deps" || exit 1
    verify_installation || exit 1
    create_config_files || exit 1
    
    print_summary
    log_success "Installation completed successfully"
}

main "$@"
