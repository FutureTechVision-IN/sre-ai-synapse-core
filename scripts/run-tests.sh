#!/bin/bash

################################################################################
# Comprehensive Test Suite for Dashboard Scripts
################################################################################

APP_ROOT="/Users/bipbabu/Library/CloudStorage/OneDrive-Cisco/Personal/Future Tech Vision/Future Tech Vision AI/GitHub/sre-synapse"
SCRIPTS_DIR="$APP_ROOT/scripts"
REPORT_FILE="$HOME/.dashboard-logs/test-report.txt"
PORT=3000

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# TEST REPORTING
# =============================================================================

init_report() {
    cat > "$REPORT_FILE" << 'EOF'
================================================================================
                    COMPREHENSIVE SYSTEM TESTING REPORT
================================================================================

Test Date: 2026-01-09
Test Environment: macOS (Bash 3.2+)
Node.js: v22.21.0
npm: v10.9.4
Vite: v6.4.1

================================================================================
                           INDIVIDUAL SCRIPT TESTS
================================================================================

EOF
}

log_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [[ "$result" == "PASS" ]]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        echo "[PASS] $test_name" >> "$REPORT_FILE"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        echo "[FAIL] $test_name" >> "$REPORT_FILE"
    fi
    
    if [[ -n "$details" ]]; then
        echo "       Details: $details"
        echo "       Details: $details" >> "$REPORT_FILE"
    fi
}

# =============================================================================
# PHASE 1: SCRIPT VALIDATION
# =============================================================================

test_script_existence() {
    echo ""
    echo -e "${BLUE}PHASE 1: Script Existence & Permissions${NC}"
    echo ""
    
    local scripts=("install.sh" "health-check.sh" "shutdown.sh" "startup.sh")
    
    for script in "${scripts[@]}"; do
        if [[ -f "$SCRIPTS_DIR/$script" && -x "$SCRIPTS_DIR/$script" ]]; then
            log_test_result "Script exists and is executable: $script" "PASS"
        else
            log_test_result "Script exists and is executable: $script" "FAIL" "File not found or not executable"
        fi
    done
}

# =============================================================================
# PHASE 2: HELP OUTPUT TESTS
# =============================================================================

test_help_output() {
    echo ""
    echo -e "${BLUE}PHASE 2: Help Output Tests${NC}"
    echo ""
    
    # Test install.sh help
    if "$SCRIPTS_DIR/install.sh" --help 2>/dev/null | grep -q "Usage:"; then
        log_test_result "install.sh --help displays usage" "PASS"
    else
        log_test_result "install.sh --help displays usage" "FAIL"
    fi
    
    # Test health-check.sh help
    if "$SCRIPTS_DIR/health-check.sh" --help 2>/dev/null | grep -q "Usage:"; then
        log_test_result "health-check.sh --help displays usage" "PASS"
    else
        log_test_result "health-check.sh --help displays usage" "FAIL"
    fi
    
    # Test shutdown.sh help
    if "$SCRIPTS_DIR/shutdown.sh" --help 2>/dev/null | grep -q "Usage:"; then
        log_test_result "shutdown.sh --help displays usage" "PASS"
    else
        log_test_result "shutdown.sh --help displays usage" "FAIL"
    fi
    
    # Test startup.sh help
    if "$SCRIPTS_DIR/startup.sh" --help 2>/dev/null | grep -q "Usage:"; then
        log_test_result "startup.sh --help displays usage" "PASS"
    else
        log_test_result "startup.sh --help displays usage" "FAIL"
    fi
}

# =============================================================================
# PHASE 3: INSTALLATION TESTS
# =============================================================================

test_installation() {
    echo ""
    echo -e "${BLUE}PHASE 3: Installation Tests${NC}"
    echo ""
    
    # Test install.sh with skip-deps (should pass since deps already installed)
    if "$SCRIPTS_DIR/install.sh" --skip-deps > /tmp/install_test.log 2>&1; then
        log_test_result "install.sh --skip-deps runs successfully" "PASS"
    else
        log_test_result "install.sh --skip-deps runs successfully" "FAIL" "See /tmp/install_test.log"
    fi
    
    # Verify node_modules exists
    if [[ -d "$APP_ROOT/node_modules" ]]; then
        log_test_result "node_modules directory exists" "PASS"
    else
        log_test_result "node_modules directory exists" "FAIL"
    fi
    
    # Verify package.json exists
    if [[ -f "$APP_ROOT/package.json" ]]; then
        log_test_result "package.json file exists" "PASS"
    else
        log_test_result "package.json file exists" "FAIL"
    fi
}

# =============================================================================
# PHASE 4: HEALTH CHECK TESTS
# =============================================================================

test_health_check() {
    echo ""
    echo -e "${BLUE}PHASE 4: Health Check Tests${NC}"
    echo ""
    
    # Test standard health check output
    local output=$("$SCRIPTS_DIR/health-check.sh" 2>&1)
    if echo "$output" | grep -q "Health Check Report"; then
        log_test_result "health-check.sh produces output" "PASS"
    else
        log_test_result "health-check.sh produces output" "FAIL"
    fi
    
    # Test JSON output
    local json_output=$("$SCRIPTS_DIR/health-check.sh" --json 2>&1)
    if echo "$json_output" | grep -q '"status"'; then
        log_test_result "health-check.sh --json produces JSON" "PASS"
    else
        log_test_result "health-check.sh --json produces JSON" "FAIL"
    fi
    
    # Test exit codes - health check returns 0, 1, or 2
    "$SCRIPTS_DIR/health-check.sh" > /dev/null 2>&1
    local exit_code=$?
    if [[ $exit_code -ge 0 && $exit_code -le 2 ]]; then
        log_test_result "health-check.sh returns valid exit code ($exit_code)" "PASS"
    else
        log_test_result "health-check.sh returns valid exit code ($exit_code)" "FAIL" "Expected 0-2, got $exit_code"
    fi
}

# =============================================================================
# PHASE 5: LOGGING TESTS
# =============================================================================

test_logging() {
    echo ""
    echo -e "${BLUE}PHASE 5: Logging Tests${NC}"
    echo ""
    
    # Check install log
    if [[ -f "$HOME/.dashboard-logs/install.log" ]]; then
        log_test_result "install.sh creates log file" "PASS"
    else
        log_test_result "install.sh creates log file" "FAIL"
    fi
    
    # Check health-check log
    if [[ -f "$HOME/.dashboard-logs/health-check.log" ]]; then
        log_test_result "health-check.sh creates log file" "PASS"
    else
        log_test_result "health-check.sh creates log file" "FAIL"
    fi
    
    # Verify log directory exists
    if [[ -d "$HOME/.dashboard-logs" ]]; then
        log_test_result "Log directory exists" "PASS"
    else
        log_test_result "Log directory exists" "FAIL"
    fi
}

# =============================================================================
# PHASE 6: DASHBOARD UI TESTS
# =============================================================================

test_dashboard_ui() {
    echo ""
    echo -e "${BLUE}PHASE 6: Dashboard UI Tests${NC}"
    echo ""
    
    # Test HTTP connection
    local response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:$PORT/" 2>/dev/null)
    if [[ "$response" == "200" ]]; then
        log_test_result "Dashboard responds to HTTP requests (200 OK)" "PASS"
    elif [[ -n "$response" ]]; then
        log_test_result "Dashboard responds to HTTP requests" "FAIL" "Got HTTP $response instead of 200"
    else
        log_test_result "Dashboard responds to HTTP requests" "FAIL" "No response on port $PORT"
    fi
    
    # Test HTML loads
    local html=$(curl -s "http://localhost:$PORT/" 2>/dev/null)
    if echo "$html" | grep -q "<html\|<HTML"; then
        log_test_result "Dashboard HTML loads correctly" "PASS"
    else
        log_test_result "Dashboard HTML loads correctly" "FAIL" "HTML not detected"
    fi
    
    # Check for SRE SYNAPSE title
    if echo "$html" | grep -q "SRE SYNAPSE"; then
        log_test_result "Dashboard title loads correctly" "PASS"
    else
        log_test_result "Dashboard title loads correctly" "FAIL" "Title not found in HTML"
    fi
}

# =============================================================================
# SUMMARY & REPORTING
# =============================================================================

print_summary() {
    echo ""
    echo "================================================================================"
    echo "                             TEST SUMMARY"
    echo "================================================================================"
    echo ""
    echo "  Total Tests:     $TESTS_TOTAL"
    echo "  Passed:          $TESTS_PASSED"
    echo "  Failed:          $TESTS_FAILED"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "  Status:          ${GREEN}✓ ALL TESTS PASSED${NC}"
        local pass_rate=100
    else
        echo -e "  Status:          ${RED}✗ SOME TESTS FAILED${NC}"
        local pass_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi
    
    echo "  Pass Rate:       $pass_rate%"
    echo ""
    echo "================================================================================"
    
    # Append to report
    cat >> "$REPORT_FILE" << EOF

================================================================================
                              TEST SUMMARY
================================================================================

Total Tests:     $TESTS_TOTAL
Passed:          $TESTS_PASSED
Failed:          $TESTS_FAILED
Pass Rate:       $pass_rate%

EOF

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}✓ ALL TESTS PASSED - DASHBOARD IS FULLY FUNCTIONAL${NC}\n"
        echo "Status: ✓ ALL TESTS PASSED" >> "$REPORT_FILE"
    else
        echo -e "\n${YELLOW}⚠ Some tests failed. Review details above.${NC}\n"
        echo "Status: ⚠ SOME TESTS FAILED" >> "$REPORT_FILE"
    fi
    
    echo "Report saved to: $REPORT_FILE"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Dashboard System Testing Suite                         ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    init_report
    test_script_existence
    test_help_output
    test_installation
    test_health_check
    test_logging
    test_dashboard_ui
    print_summary
}

main "$@"
