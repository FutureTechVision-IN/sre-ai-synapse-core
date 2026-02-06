#!/bin/bash

################################################################################
# Health Check Script for Frontend Dashboard
# Purpose: Monitor dashboard service health and system status
# Exit Codes: 0=healthy, 1=warning, 2=critical
################################################################################

set -o pipefail

# Configuration
HEALTH_CHECK_LOG="${HOME}/.dashboard-logs/health-check.log"
PORT="${VITE_PORT:-3000}"
HOST="${VITE_HOST:-localhost}"
TIMEOUT=5

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_check() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$HEALTH_CHECK_LOG" 2>/dev/null
}

# Health check results
HEALTH_STATUS=0
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

# ============================================================================
# HEALTH CHECK FUNCTIONS
# ============================================================================

check_process_running() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "  Checking if server process is running... "
    
    if lsof -i :$PORT >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        log_check "Process check: PASS"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
        HEALTH_STATUS=2
        log_check "Process check: FAIL - No process on port $PORT"
        return 1
    fi
}

check_http_response() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "  Checking HTTP response... "
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "http://$HOST:$PORT/" 2>/dev/null)
    
    if [[ "$response" == "200" ]]; then
        echo -e "${GREEN}✓ PASS (HTTP $response)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        log_check "HTTP check: PASS (code: $response)"
        return 0
    elif [[ -n "$response" && "$response" != "000" ]]; then
        echo -e "${YELLOW}⚠ WARNING (HTTP $response)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        if [[ $HEALTH_STATUS -eq 0 ]]; then HEALTH_STATUS=1; fi
        log_check "HTTP check: WARNING (code: $response)"
        return 1
    else
        echo -e "${RED}✗ FAIL (No response)${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
        HEALTH_STATUS=2
        log_check "HTTP check: FAIL - No HTTP response"
        return 1
    fi
}

check_port_listening() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "  Checking if port $PORT is listening... "
    
    if lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        log_check "Port listening check: PASS"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
        HEALTH_STATUS=2
        log_check "Port listening check: FAIL"
        return 1
    fi
}

check_memory_usage() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "  Checking memory usage... "
    
    local memory_usage=$(ps aux | grep -E "npm|node" | grep -v grep | awk '{sum+=$6} END {print sum}')
    local memory_mb=$((memory_usage / 1024))
    
    if [[ -z "$memory_usage" || "$memory_usage" == "0" ]]; then
        echo -e "${YELLOW}⚠ WARNING (No Node process found)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        if [[ $HEALTH_STATUS -eq 0 ]]; then HEALTH_STATUS=1; fi
        log_check "Memory check: WARNING - No Node process"
        return 1
    elif [[ $memory_mb -gt 1000 ]]; then
        echo -e "${YELLOW}⚠ WARNING (${memory_mb}MB)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        if [[ $HEALTH_STATUS -eq 0 ]]; then HEALTH_STATUS=1; fi
        log_check "Memory check: WARNING - High memory usage: ${memory_mb}MB"
        return 1
    else
        echo -e "${GREEN}✓ PASS (${memory_mb}MB)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        log_check "Memory check: PASS - Memory: ${memory_mb}MB"
        return 0
    fi
}

check_disk_space() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "  Checking disk space... "
    
    local disk_usage=$(df -h "$HOME" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $disk_usage -gt 90 ]]; then
        echo -e "${RED}✗ FAIL (${disk_usage}% used)${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
        HEALTH_STATUS=2
        log_check "Disk check: FAIL - ${disk_usage}% used"
        return 1
    elif [[ $disk_usage -gt 80 ]]; then
        echo -e "${YELLOW}⚠ WARNING (${disk_usage}% used)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        if [[ $HEALTH_STATUS -eq 0 ]]; then HEALTH_STATUS=1; fi
        log_check "Disk check: WARNING - ${disk_usage}% used"
        return 1
    else
        echo -e "${GREEN}✓ PASS (${disk_usage}% used)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        log_check "Disk check: PASS - ${disk_usage}% used"
        return 0
    fi
}

# ============================================================================
# OUTPUT FUNCTIONS
# ============================================================================

print_text_output() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Dashboard Health Check Report                          ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Timestamp:  $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "  Host:       $HOST"
    echo -e "  Port:       $PORT"
    echo ""
    echo -e "${BLUE}Health Checks:${NC}"
}

print_json_output() {
    local status_text="healthy"
    [[ $HEALTH_STATUS -eq 1 ]] && status_text="warning"
    [[ $HEALTH_STATUS -eq 2 ]] && status_text="critical"
    
    cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "$status_text",
  "exit_code": $HEALTH_STATUS,
  "host": "$HOST",
  "port": $PORT,
  "checks": {
    "total": $CHECKS_TOTAL,
    "passed": $CHECKS_PASSED,
    "failed": $CHECKS_FAILED
  }
}
EOF
}

print_summary() {
    echo ""
    echo -e "${BLUE}Summary:${NC}"
    echo -e "  Total Checks:  $CHECKS_TOTAL"
    echo -e "  Passed:        ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "  Failed:        ${RED}$CHECKS_FAILED${NC}"
    echo ""
    
    case $HEALTH_STATUS in
        0)
            echo -e "  Status:        ${GREEN}✓ HEALTHY${NC}"
            ;;
        1)
            echo -e "  Status:        ${YELLOW}⚠ WARNING${NC}"
            ;;
        2)
            echo -e "  Status:        ${RED}✗ CRITICAL${NC}"
            ;;
    esac
    
    echo ""
}

# ============================================================================
# HELP & PARSING
# ============================================================================

print_help() {
    cat <<EOF
Usage: health-check.sh [OPTIONS]

Options:
    --verbose  Show detailed output with all checks
    --json     Output in JSON format (useful for monitoring systems)
    --help     Show this help message

Examples:
    ./health-check.sh              # Standard health check
    ./health-check.sh --verbose    # Detailed report
    ./health-check.sh --json       # JSON output for scripts

Exit Codes:
    0  - Dashboard is healthy
    1  - Dashboard is running but with warnings
    2  - Dashboard is critical/not responding

EOF
}

# Parse arguments
JSON_OUTPUT=false
VERBOSE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            VERBOSE=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            print_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            print_help
            exit 1
            ;;
    esac
done

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Create log directory
mkdir -p "$(dirname "$HEALTH_CHECK_LOG")"

if [[ "$JSON_OUTPUT" == true ]]; then
    # Run checks silently for JSON output
    check_process_running >/dev/null 2>&1
    check_http_response >/dev/null 2>&1
    check_port_listening >/dev/null 2>&1
    check_memory_usage >/dev/null 2>&1
    check_disk_space >/dev/null 2>&1
    
    # Output JSON
    print_json_output
else
    # Standard output
    print_text_output
    check_process_running
    check_http_response
    check_port_listening
    check_memory_usage
    check_disk_space
    print_summary
fi

exit $HEALTH_STATUS
