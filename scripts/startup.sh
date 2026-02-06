#!/bin/bash

################################################################################
# Frontend Dashboard Startup Script
# Purpose: Initialize and start the frontend dashboard application
# Platform: macOS / Linux
# Author: SRE Synapse Team
# Date: January 2026
################################################################################

set -o pipefail

# ============================================================================
# CONFIGURATION VARIABLES
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${HOME}/.dashboard-logs"
LOG_FILE="${LOG_DIR}/startup.log"
PID_FILE="${HOME}/.dashboard.pid"
MAX_STARTUP_TIME=60
PORT="${VITE_PORT:-3000}"
HOST="${VITE_HOST:-127.0.0.1}"
NODE_ENV="${NODE_ENV:-development}"
DEV_MODE=false
SKIP_DEPS=false

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE" 2>/dev/null
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE" 2>/dev/null
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "[WARNING] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE" 2>/dev/null
}

log_error() {
    echo -e "${RED}[✗]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE" 2>/dev/null
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Frontend Dashboard Startup Script                       ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_help() {
    cat << EOF
Usage: startup.sh [OPTIONS]

Options:
    --dev               Start in development mode (hot reload enabled)
    --skip-deps         Skip dependency installation (use existing node_modules)
    --port PORT         Specify custom port (default: 5173)
    --host HOST         Specify custom host (default: 127.0.0.1)
    --help              Show this help message

Examples:
    ./startup.sh                    # Start with defaults
    ./startup.sh --dev              # Start in dev mode
    ./startup.sh --port 3000        # Start on port 3000
    ./startup.sh --dev --port 8000  # Dev mode on port 8000

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev)
                DEV_MODE=true
                NODE_ENV="development"
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --port)
                PORT="$2"
                shift 2
                ;;
            --host)
                HOST="$2"
                shift 2
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
}

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_node_version() {
    log_info "Checking Node.js version..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js v16 or later."
        return 1
    fi
    
    local node_version=$(node --version 2>/dev/null | sed 's/^v//')
    local node_major=$(echo "$node_version" | cut -d. -f1)
    
    if [[ $node_major -lt 16 ]]; then
        log_error "Node.js v16+ required, but v$node_version is installed."
        return 1
    fi
    
    log_success "Node.js v$node_version detected ✓"
    return 0
}

check_npm_version() {
    log_info "Checking npm version..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm v7 or later."
        return 1
    fi
    
    local npm_version=$(npm --version 2>/dev/null)
    local npm_major=$(echo "$npm_version" | cut -d. -f1)
    
    if [[ $npm_major -lt 7 ]]; then
        log_error "npm v7+ required, but v$npm_version is installed."
        return 1
    fi
    
    log_success "npm v$npm_version detected ✓"
    return 0
}

check_port_available() {
    log_info "Checking if port $PORT is available..."
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "Port $PORT is already in use. Please free the port or specify a different one with --port."
        return 1
    fi
    
    log_success "Port $PORT is available ✓"
    return 0
}

check_dependencies() {
    if [[ "$SKIP_DEPS" == true ]]; then
        log_info "Skipping dependency check (--skip-deps flag set)"
        return 0
    fi
    
    log_info "Checking for node_modules..."
    
    if [[ ! -d "$APP_ROOT/node_modules" ]]; then
        log_warning "node_modules not found, will be installed"
        return 0
    fi
    
    log_success "node_modules directory exists ✓"
    return 0
}

# ============================================================================
# INSTALLATION & SETUP
# ============================================================================

install_dependencies() {
    if [[ "$SKIP_DEPS" == true ]]; then
        log_info "Skipping npm install (--skip-deps flag set)"
        return 0
    fi
    
    log_info "Installing dependencies..."
    
    cd "$APP_ROOT" || {
        log_error "Failed to change directory to $APP_ROOT"
        return 1
    }
    
    if [[ ! -d "node_modules" ]]; then
        npm install --legacy-peer-deps >> "$LOG_FILE" 2>&1
        if [[ $? -ne 0 ]]; then
            log_error "npm install failed. Check $LOG_FILE for details."
            return 1
        fi
    fi
    
    log_success "Dependencies installed ✓"
    return 0
}

build_application() {
    if [[ "$DEV_MODE" == true ]]; then
        log_info "Skipping build in development mode"
        return 0
    fi
    
    log_info "Building application..."
    
    cd "$APP_ROOT" || {
        log_error "Failed to change directory to $APP_ROOT"
        return 1
    }
    
    npm run build >> "$LOG_FILE" 2>&1
    if [[ $? -ne 0 ]]; then
        log_error "npm run build failed. Check $LOG_FILE for details."
        return 1
    fi
    
    log_success "Application built ✓"
    return 0
}

# ============================================================================
# SERVICE STARTUP
# ============================================================================

terminate_existing_processes() {
    log_info "Checking for existing processes..."
    
    if [[ -f "$PID_FILE" ]]; then
        local old_pid=$(cat "$PID_FILE" 2>/dev/null)
        if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
            log_warning "Found existing process (PID: $old_pid), terminating..."
            kill -SIGTERM "$old_pid" 2>/dev/null
            sleep 2
            
            if kill -0 "$old_pid" 2>/dev/null; then
                log_warning "Process did not terminate gracefully, forcing..."
                kill -SIGKILL "$old_pid" 2>/dev/null
            fi
            rm -f "$PID_FILE"
        fi
    fi
    
    # Also try to find and kill processes on the target port
    local pids=$(lsof -ti:$PORT 2>/dev/null)
    if [[ -n "$pids" ]]; then
        log_warning "Found process(es) on port $PORT, terminating..."
        echo "$pids" | xargs kill -SIGTERM 2>/dev/null || true
        sleep 2
        echo "$pids" | xargs kill -SIGKILL 2>/dev/null || true
    fi
}

start_dev_server() {
    log_info "Starting Vite dev server..."
    log_info "Environment: $NODE_ENV | Host: $HOST | Port: $PORT"
    
    cd "$APP_ROOT" || {
        log_error "Failed to change directory to $APP_ROOT"
        return 1
    }
    
    export VITE_PORT="$PORT"
    export VITE_HOST="$HOST"
    export NODE_ENV="$NODE_ENV"
    
    # Start the dev server in the background
    npm run dev >> "$LOG_FILE" 2>&1 &
    local pid=$!
    
    echo "$pid" > "$PID_FILE"
    
    log_info "Dev server started (PID: $pid)"
    
    # Wait for server to start
    local timeout=0
    while [[ $timeout -lt $MAX_STARTUP_TIME ]]; do
        if curl -s "http://$HOST:$PORT/" > /dev/null 2>&1; then
            log_success "Dev server is responding on http://$HOST:$PORT ✓"
            return 0
        fi
        sleep 1
        timeout=$((timeout + 1))
    done
    
    log_error "Dev server failed to respond within ${MAX_STARTUP_TIME}s"
    return 1
}

start_preview_server() {
    log_info "Starting preview server..."
    log_info "Host: $HOST | Port: $PORT"
    
    cd "$APP_ROOT" || {
        log_error "Failed to change directory to $APP_ROOT"
        return 1
    }
    
    export VITE_PORT="$PORT"
    export VITE_HOST="$HOST"
    
    # Start the preview server in the background
    npm run preview >> "$LOG_FILE" 2>&1 &
    local pid=$!
    
    echo "$pid" > "$PID_FILE"
    
    log_info "Preview server started (PID: $pid)"
    
    # Wait for server to start
    local timeout=0
    while [[ $timeout -lt $MAX_STARTUP_TIME ]]; do
        if curl -s "http://$HOST:$PORT/" > /dev/null 2>&1; then
            log_success "Preview server is responding on http://$HOST:$PORT ✓"
            return 0
        fi
        sleep 1
        timeout=$((timeout + 1))
    done
    
    log_error "Preview server failed to respond within ${MAX_STARTUP_TIME}s"
    return 1
}

open_in_browser() {
    local url="http://$HOST:$PORT"
    
    log_info "Opening dashboard in browser..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url" 2>/dev/null || log_warning "Could not open browser automatically"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "$url" 2>/dev/null || log_warning "Could not open browser automatically"
    fi
}

print_startup_summary() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  Dashboard Startup Complete                             ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Dashboard URL:  ${BLUE}http://$HOST:$PORT${NC}"
    echo -e "Process ID:     ${BLUE}$(cat $PID_FILE 2>/dev/null)${NC}"
    echo -e "Log File:       ${BLUE}$LOG_FILE${NC}"
    echo -e "Mode:           ${BLUE}$([ "$DEV_MODE" = true ] && echo "Development (Hot Reload)" || echo "Preview")${NC}"
    echo ""
    echo -e "${YELLOW}To stop the dashboard, run:${NC}"
    echo -e "  ${BLUE}kill $(cat $PID_FILE 2>/dev/null)${NC}"
    echo ""
}

# ============================================================================
# ERROR HANDLING
# ============================================================================

cleanup_on_error() {
    local exit_code=$?
    log_error "Startup failed (exit code: $exit_code)"
    exit $exit_code
}

trap cleanup_on_error EXIT

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    # Reset trap to avoid double-cleanup
    trap - EXIT
    
    print_header
    
    # Parse arguments
    parse_arguments "$@"
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    log_info "Starting dashboard initialization..."
    log_info "Application root: $APP_ROOT"
    
    # Run prerequisite checks
    check_node_version || exit 1
    check_npm_version || exit 1
    check_port_available || exit 1
    check_dependencies || exit 1
    
    # Terminate any existing processes
    terminate_existing_processes
    
    # Install dependencies
    install_dependencies || exit 1
    
    # Build if not in dev mode
    if [[ "$DEV_MODE" != true ]]; then
        build_application || exit 1
        start_preview_server || exit 1
    else
        start_dev_server || exit 1
    fi
    
    # Try to open browser
    open_in_browser
    
    # Print summary
    print_startup_summary
    
    log_success "Dashboard is running successfully!"
    
    # Keep the script running and monitoring
    local pid=$(cat "$PID_FILE" 2>/dev/null)
    if [[ -n "$pid" ]]; then
        wait $pid 2>/dev/null
    fi
}

# Execute main function
main "$@"
