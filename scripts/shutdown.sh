#!/bin/bash

################################################################################
# Shutdown Script for Frontend Dashboard
# Purpose: Gracefully terminate dashboard services
################################################################################

set -o pipefail

# Configuration
SHUTDOWN_LOG="${HOME}/.dashboard-logs/shutdown.log"
PID_FILE="${HOME}/.dashboard.pid"
PORT="${VITE_PORT:-3000}"
GRACEFUL_TIMEOUT=30

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$SHUTDOWN_LOG" 2>/dev/null
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    echo "[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$SHUTDOWN_LOG" 2>/dev/null
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[WARNING] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$SHUTDOWN_LOG" 2>/dev/null
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" >&2
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$SHUTDOWN_LOG" 2>/dev/null
}

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Frontend Dashboard Shutdown Script                     ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_help() {
    cat <<EOF
Usage: shutdown.sh [OPTIONS]

Options:
    --force   Force immediate termination (SIGKILL)
    --help    Show this help message

Examples:
    ./shutdown.sh         # Graceful shutdown with 30s timeout
    ./shutdown.sh --force # Force immediate termination

EOF
}

# ============================================================================
# SHUTDOWN FUNCTIONS
# ============================================================================

terminate_gracefully() {
    log_info "Starting graceful shutdown..."
    
    # Find processes on the port
    local pids=$(lsof -ti:$PORT 2>/dev/null)
    
    if [[ -z "$pids" ]]; then
        log_warning "No processes found on port $PORT"
        return 0
    fi
    
    log_info "Sending SIGTERM to processes: $pids"
    echo "$pids" | xargs kill -SIGTERM 2>/dev/null || true
    
    # Wait for graceful termination
    local waited=0
    while [[ $waited -lt $GRACEFUL_TIMEOUT ]]; do
        if ! lsof -i :$PORT >/dev/null 2>&1; then
            log_success "Processes terminated gracefully"
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    
    # Force kill if still running
    log_warning "Graceful shutdown timeout, forcing termination..."
    echo "$pids" | xargs kill -SIGKILL 2>/dev/null || true
    sleep 1
    
    if lsof -i :$PORT >/dev/null 2>&1; then
        log_error "Failed to terminate processes on port $PORT"
        return 1
    fi
    
    log_success "Processes force-killed"
    return 0
}

cleanup_pid_file() {
    log_info "Cleaning up PID file..."
    
    if [[ -f "$PID_FILE" ]]; then
        rm -f "$PID_FILE"
        log_success "PID file removed"
    fi
}

backup_logs() {
    log_info "Backing up logs..."
    
    local log_dir="${HOME}/.dashboard-logs"
    local backup_dir="${log_dir}/backups"
    
    if [[ -d "$log_dir" ]]; then
        mkdir -p "$backup_dir"
        local timestamp=$(date '+%Y%m%d_%H%M%S')
        tar -czf "$backup_dir/logs_backup_${timestamp}.tar.gz" "$log_dir"/*.log 2>/dev/null || true
        log_success "Logs backed up to $backup_dir"
    fi
}

cleanup_cache() {
    log_info "Cleaning up temporary files..."
    
    local app_root="/Users/bipbabu/Library/CloudStorage/OneDrive-Cisco/Personal/Future Tech Vision/Future Tech Vision AI/GitHub/sre-synapse"
    
    # Clean Vite cache
    if [[ -d "$app_root/.vite" ]]; then
        rm -rf "$app_root/.vite"
        log_success "Vite cache cleaned"
    fi
    
    # Clean npm cache (optional)
    # npm cache clean --force >> "$SHUTDOWN_LOG" 2>&1
}

print_summary() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  Dashboard Shutdown Complete                            ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Timestamp:  $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "  Log File:   $SHUTDOWN_LOG"
    echo ""
    echo -e "Dashboard is now ${GREEN}STOPPED${NC}"
    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    local force_kill=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_kill=true
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
    mkdir -p "$(dirname "$SHUTDOWN_LOG")"
    
    print_header
    log_info "Starting dashboard shutdown process..."
    log_info "Port: $PORT"
    log_info "Graceful timeout: ${GRACEFUL_TIMEOUT}s"
    
    # Terminate processes
    if [[ "$force_kill" == true ]]; then
        log_warning "Force kill mode enabled"
        local pids=$(lsof -ti:$PORT 2>/dev/null)
        if [[ -n "$pids" ]]; then
            echo "$pids" | xargs kill -SIGKILL 2>/dev/null || true
            sleep 1
        fi
    else
        terminate_gracefully || {
            log_error "Graceful shutdown failed"
            exit 1
        }
    fi
    
    # Verify termination
    if lsof -i :$PORT >/dev/null 2>&1; then
        log_error "Dashboard still running on port $PORT"
        exit 1
    fi
    
    log_success "Port $PORT is now free"
    
    # Cleanup
    cleanup_pid_file
    backup_logs
    cleanup_cache
    
    print_summary
    log_success "Shutdown completed successfully"
}

main "$@"
