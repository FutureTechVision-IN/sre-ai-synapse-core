#!/bin/bash

# Configuration
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
STOP_LOG="$LOG_DIR/shutdown.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%T')]${NC} $1" | tee -a "$STOP_LOG"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$STOP_LOG"; }

FORCE=false
ALL=false

for arg in "$@"; do
    case $arg in
        --force) FORCE=true ;;
        --all)   ALL=true ;;
    esac
done

log "Starting graceful termination..."

# 1. Stop Native Processes if they exist
if [ -f ".app.pid" ]; then
    PID=$(cat .app.pid)
    log "Stopping native app (PID: $PID)..."
    kill $PID 2>/dev/null
    rm .app.pid
fi

# Use existing shutdown script for cleanup on port 3000
if [ -f "./scripts/shutdown.sh" ]; then
    ./scripts/shutdown.sh $([ "$FORCE" = true ] && echo "--force")
fi

# 2. Stop Docker containers
if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    log "Stopping Docker containers..."
    if [ "$ALL" = true ]; then
        docker-compose down -v --remove-orphans
    else
        docker-compose stop
    fi
fi

# 3. Final State Save / Cleanup
log "Performing final cleanup..."
# Placeholder for state saving logic if needed
# sync_state_to_disk

success "All processes terminated. Resources released."
