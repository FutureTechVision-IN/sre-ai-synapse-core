#!/bin/bash

# Configuration
PORT=3000
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
START_LOG="$LOG_DIR/startup.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%T')]${NC} $1" | tee -a "$START_LOG"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$START_LOG"; exit 1; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$START_LOG"; }

# 1. Environment Validation
log "Validating environment..."
if [ ! -f "package.json" ]; then
    error "package.json not found. Are you in the project root?"
fi

# Check for .env file
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    log "${YELLOW}Warning: No .env or .env.local file found. Creating empty .env...${NC}"
    touch .env
fi

# 2. Argument Parsing
MODE="auto"
BUILD=false

for arg in "$@"; do
    case $arg in
        --docker) MODE="docker" ;;
        --native) MODE="native" ;;
        --hybrid) MODE="hybrid" ;;
        --build)  BUILD=true ;;
    esac
done

# Auto-detect if not specified
if [ "$MODE" == "auto" ]; then
    if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
        MODE="docker"
    else
        MODE="native"
    fi
fi

log "Startup mode: ${GREEN}$MODE${NC}"

# 3. Execution Logic
case $MODE in
    docker)
        log "Starting in Docker mode..."
        if [ "$BUILD" = true ]; then
            docker-compose build || error "Docker build failed"
        fi
        docker-compose up -d || error "Docker-compose power-up failed"
        ;;
    
    hybrid)
        log "Starting in Hybrid mode (Docker DB + Native App)..."
        docker-compose up -d database || error "Failed to start Docker database"
        log "Waiting for database health..."
        # Basic health wait
        sleep 5 
        npm install && npm run dev & 
        echo $! > .app.pid
        ;;
    
    native)
        log "Starting in Native mode..."
        if [ ! -d "node_modules" ]; then
            log "Installing dependencies..."
            npm install || error "npm install failed"
        fi
        ./scripts/startup.sh --dev --port $PORT &
        echo $! > .app.pid
        ;;
esac

# 4. Health Monitoring
log "Monitoring service health on port $PORT..."
RETRIES=0
MAX_RETRIES=20
until $(curl -sSf http://localhost:$PORT > /dev/null 2>&1); do
    printf "."
    sleep 2
    RETRIES=$((RETRIES+1))
    if [ $RETRIES -eq $MAX_RETRIES ]; then
        echo ""
        error "Service failed to become healthy on port $PORT after $MAX_RETRIES attempts."
    fi
done

echo ""
success "Dashboard is fully operational at http://localhost:$PORT"
log "Logs available at $START_LOG"
