#!/bin/bash

# SRE Synapse - GitHub Pages Deployment Script
# This script safely deploys the production build to gh-pages

set -e  # Exit on error

echo "🚀 SRE Synapse - gh-pages Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: You're on branch '$CURRENT_BRANCH', not 'main'${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Step 2: Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Error: You have uncommitted changes${NC}"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

# Step 3: Build production version
echo "📦 Building production assets..."
rm -rf dist
GITHUB_PAGES=true npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: Build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Step 4: Store current branch
ORIGINAL_BRANCH=$(git branch --show-current)

# Step 5: Create or update gh-pages branch
echo "🌐 Preparing gh-pages branch..."

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "📝 gh-pages branch exists, switching to it..."
    git checkout gh-pages
    
    # Remove old files but keep .git
    find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} +
else
    echo "📝 Creating new gh-pages orphan branch..."
    git checkout --orphan gh-pages
    git rm -rf . 2>/dev/null || true
fi

# Step 6: Copy build files
echo "📋 Copying build files to gh-pages..."
cp -r dist/* .
cp dist/.* . 2>/dev/null || true

# Step 7: Create .nojekyll (bypass Jekyll processing)
touch .nojekyll

# Step 8: Create CNAME if needed (optional - user can configure)
# echo "your-domain.com" > CNAME

# Step 9: Stage all files
echo "📥 Staging files for commit..."
git add -A

# Step 10: Commit
if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  No changes to deploy${NC}"
else
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    git commit -m "deploy: production build - $TIMESTAMP"
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Step 11: Return to original branch
echo "🔄 Returning to $ORIGINAL_BRANCH branch..."
git checkout "$ORIGINAL_BRANCH"

echo ""
echo "======================================"
echo -e "${GREEN}✅ gh-pages branch prepared successfully!${NC}"
echo ""
echo "📌 Next steps:"
echo "1. Push to remote: git push origin gh-pages"
echo "2. Or force push if needed: git push origin gh-pages --force"
echo "3. Enable GitHub Pages in repository settings"
echo "4. Access your site at: https://<username>.github.io/sre-synapse/"
echo ""
echo "⚠️  Note: Make sure you've configured your remote repository first!"
echo "   git remote add origin https://github.com/<USERNAME>/sre-synapse.git"
