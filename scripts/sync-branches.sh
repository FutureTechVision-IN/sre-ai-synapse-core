#!/bin/bash

# SRE Synapse - Branch Synchronization Script
# Pushes all branches to remote repository

set -e

echo "🔄 SRE Synapse - Branch Synchronization"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if remote is configured
if ! git remote | grep -q 'origin'; then
    echo -e "${RED}❌ Error: No remote repository configured${NC}"
    echo ""
    echo "Please configure your remote repository first:"
    echo -e "${BLUE}  git remote add origin https://github.com/<USERNAME>/sre-synapse.git${NC}"
    echo ""
    read -p "Enter your GitHub repository URL (or press Enter to skip): " REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}✅ Remote added successfully${NC}"
    else
        echo "❌ Cancelled"
        exit 1
    fi
fi

# Verify remote
echo ""
echo "📡 Current remote configuration:"
git remote -v
echo ""

read -p "Continue with branch synchronization? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Get current branch to return to later
ORIGINAL_BRANCH=$(git branch --show-current)

# Array of branches to sync
BRANCHES=("main" "dev" "dev1" "dev2")

echo ""
echo "🔄 Synchronizing branches..."
echo "======================================"

# Counter for success/failure
SUCCESS_COUNT=0
FAIL_COUNT=0

# Push each branch
for BRANCH in "${BRANCHES[@]}"; do
    echo ""
    echo -e "${BLUE}📤 Pushing branch: $BRANCH${NC}"
    
    # Check if branch exists locally
    if git show-ref --verify --quiet refs/heads/$BRANCH; then
        # Try to push
        if git push -u origin $BRANCH 2>&1; then
            echo -e "${GREEN}✅ Successfully pushed $BRANCH${NC}"
            ((SUCCESS_COUNT++))
        else
            echo -e "${YELLOW}⚠️  Warning: Failed to push $BRANCH (may already be up to date)${NC}"
            ((FAIL_COUNT++))
        fi
    else
        echo -e "${RED}❌ Branch $BRANCH does not exist locally${NC}"
        ((FAIL_COUNT++))
    fi
done

# Return to original branch
if [ "$ORIGINAL_BRANCH" != "$(git branch --show-current)" ]; then
    git checkout "$ORIGINAL_BRANCH"
fi

echo ""
echo "======================================"
echo "📊 Synchronization Summary:"
echo -e "${GREEN}  ✅ Successful: $SUCCESS_COUNT${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${YELLOW}  ⚠️  Warnings/Skipped: $FAIL_COUNT${NC}"
fi

echo ""
echo "🔍 Verify remote branches:"
echo -e "${BLUE}  git ls-remote --heads origin${NC}"
echo ""

# Optionally show remote branches
read -p "Show remote branches now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    git ls-remote --heads origin
fi

echo ""
echo -e "${GREEN}✅ Branch synchronization complete!${NC}"
