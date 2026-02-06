# Deployment Checklist - SRE Synapse
**Date**: February 7, 2026
**Status**: Ready for Execution

## Pre-Deployment Verification
- [x] Repository initialized with git
- [x] All changes committed to main branch
- [x] Local branches created: main, dev, dev1, dev2
- [x] Build verification completed successfully
- [x] Dependencies installed and verified
- [ ] Remote repository configured
- [ ] GitHub repository URL confirmed

## Branch Synchronization Tasks

### 1. Remote Repository Setup
```bash
# Configure remote (replace with your GitHub username/org)
git remote add origin https://github.com/<USERNAME>/sre-synapse.git
git remote -v  # Verify remote is set
```

### 2. Push All Branches to Remote
```bash
# Push main branch
git push -u origin main

# Push development branches
git push -u origin dev
git push -u origin dev1
git push -u origin dev2
```

### 3. gh-pages Deployment

#### Build Production Assets
```bash
# Clean build
rm -rf dist
npm run build
```

#### Create gh-pages Branch
```bash
# Create orphan branch for gh-pages
git checkout --orphan gh-pages

# Remove all files from staging
git rm -rf .

# Copy built assets
cp -r dist/* .
cp dist/.* . 2>/dev/null || true

# Create .nojekyll to bypass Jekyll processing
touch .nojekyll

# Add essential files
git add index.html assets/ .nojekyll

# Commit
git commit -m "deploy: initial gh-pages deployment"

# Push to remote
git push -u origin gh-pages

# Return to main branch
git checkout main
```

## System Integrity Checks

### Frontend Dashboard
- [ ] Login system functional
- [ ] Dashboard UI renders correctly
- [ ] Data visualization components working
- [ ] File upload mechanism operational
- [ ] Chat interface responsive
- [ ] API key configuration accessible

### Backend Services
- [ ] Gemini API integration active
- [ ] Document classification working
- [ ] Neural quota resilience active
- [ ] Model fallback mechanism tested
- [ ] Error handling validated

### Data Integrity
- [ ] Classification logic validated
- [ ] Metadata extraction accurate
- [ ] Session persistence working
- [ ] User data secure

## Rollback Procedures

### If Main Branch Push Fails
```bash
git reset --hard HEAD~1
git push origin main --force
```

### If gh-pages Deployment Fails
```bash
git checkout gh-pages
git reset --hard HEAD~1
git push origin gh-pages --force
git checkout main
```

### If Remote Sync Issues Occur
```bash
# Force sync from local
git push origin <branch> --force

# Or reset to remote
git fetch origin
git reset --hard origin/<branch>
```

## Post-Deployment Verification

### GitHub Pages URL
- Expected URL: `https://<USERNAME>.github.io/sre-synapse/`
- [ ] Site accessible
- [ ] Assets loading correctly
- [ ] No console errors
- [ ] Backend connectivity working

### Branch Status
```bash
# Verify all branches are pushed
git ls-remote --heads origin

# Expected output:
# refs/heads/dev
# refs/heads/dev1
# refs/heads/dev2
# refs/heads/gh-pages
# refs/heads/main
```

## Critical Notes

1. **Environment Variables**: Ensure `.env` is NOT committed to gh-pages
2. **API Keys**: Verify production API keys are configured separately
3. **CORS**: GitHub Pages may require CORS configuration for API calls
4. **Build Size**: Current bundle ~2.2MB (consider code splitting)

## Success Criteria
- [x] All code changes committed
- [ ] All branches pushed to remote
- [ ] gh-pages deployed and accessible
- [ ] Frontend fully functional on gh-pages
- [ ] No data loss or corruption
- [ ] All critical features operational
