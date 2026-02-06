# Complete Deployment Guide - SRE Synapse

## Overview
This guide provides step-by-step instructions for deploying the SRE Synapse application to GitHub Pages and synchronizing all branches.

## Prerequisites
- ✅ Git installed and configured
- ✅ npm installed (verified)
- ✅ GitHub account
- ✅ Repository created on GitHub (or will be created)
- ✅ All local changes committed

## Quick Start

### Option 1: Automated Deployment (Recommended)
Run the complete deployment script:
```bash
./scripts/deploy-all.sh
```

This will:
1. Check system prerequisites
2. Configure remote repository (if needed)
3. Build production assets
4. Synchronize all branches
5. Deploy to gh-pages
6. Push everything to GitHub

### Option 2: Manual Step-by-Step

#### Step 1: Configure GitHub Repository

If you haven't created a GitHub repository yet:
1. Go to https://github.com/new
2. Name: `sre-synapse`
3. Keep it Public or Private (your choice)
4. **Do NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

Configure remote:
```bash
# Replace <USERNAME> with your GitHub username
git remote add origin https://github.com/<USERNAME>/sre-synapse.git
git remote -v  # Verify
```

#### Step 2: Synchronize Branches

Push all branches to GitHub:
```bash
./scripts/sync-branches.sh
```

Or manually:
```bash
git push -u origin main
git push -u origin dev
git push -u origin dev1
git push -u origin dev2
```

#### Step 3: Deploy to gh-pages

```bash
./scripts/deploy-gh-pages.sh
```

Or manually:
```bash
# Build production
npm run build

# Create gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
cp -r dist/* .
touch .nojekyll
git add -A
git commit -m "deploy: initial gh-pages deployment"
git push -u origin gh-pages
git checkout main
```

#### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll to "Pages" section (left sidebar)
4. Under "Source":
   - Branch: `gh-pages`
   - Folder: `/ (root)`
5. Click "Save"
6. Wait 1-2 minutes for deployment

#### Step 5: Access Your Site

Your site will be available at:
```
https://<USERNAME>.github.io/sre-synapse/
```

## Branch Structure

| Branch | Purpose | Auto-Deploy |
|--------|---------|-------------|
| `main` | Production-ready code | Manual |
| `dev` | Development/testing | Manual |
| `dev1` | Feature development 1 | Manual |
| `dev2` | Feature development 2 | Manual |
| `gh-pages` | Deployed static site | Built from main |

## Deployment Scripts

### `deploy-all.sh`
Complete deployment orchestrator. Runs all deployment steps in sequence.

**Usage:**
```bash
./scripts/deploy-all.sh
```

**What it does:**
- Validates system prerequisites
- Checks for uncommitted changes
- Configures remote (if needed)
- Builds production assets
- Syncs all branches
- Deploys to gh-pages
- Verifies deployment

### `sync-branches.sh`
Synchronizes local branches with remote repository.

**Usage:**
```bash
./scripts/sync-branches.sh
```

**What it does:**
- Checks remote configuration
- Pushes main, dev, dev1, dev2 to origin
- Provides sync summary

### `deploy-gh-pages.sh`
Deploys production build to gh-pages branch.

**Usage:**
```bash
./scripts/deploy-gh-pages.sh
```

**What it does:**
- Builds production version
- Creates/updates gh-pages branch
- Copies dist/ contents
- Creates .nojekyll file
- Commits changes (ready to push)

## GitHub Pages Configuration

### Important Notes

1. **Environment Variables**: 
   - `.env` files are NOT deployed to gh-pages
   - Configure production API keys separately
   - Use environment variable configuration in GitHub Settings

2. **API Key Setup**:
   - Users must configure their own API keys via the UI
   - The `APIKeyConfigPanel` component handles runtime configuration
   - Keys are stored in localStorage (client-side only)

3. **Backend Connectivity**:
   - GitHub Pages serves static files only
   - All API calls go directly to Google Gemini API
   - No server-side backend required

4. **CORS Considerations**:
   - Google Gemini API supports CORS for browser requests
   - API calls should work from gh-pages domain

### Custom Domain (Optional)

To use a custom domain:

1. Create `CNAME` file in gh-pages root:
   ```bash
   git checkout gh-pages
   echo "your-domain.com" > CNAME
   git add CNAME
   git commit -m "add: custom domain"
   git push origin gh-pages
   git checkout main
   ```

2. Configure DNS:
   - Add CNAME record: `your-domain.com` → `<username>.github.io`
   - Or A records to GitHub Pages IPs

3. Enable HTTPS in GitHub Settings → Pages

## Troubleshooting

### Issue: Remote push rejected
**Solution:**
```bash
# Force push (use with caution)
git push origin <branch> --force
```

### Issue: gh-pages not updating
**Solution:**
```bash
# Force rebuild gh-pages
git checkout gh-pages
git commit --amend --no-edit
git push origin gh-pages --force
git checkout main
```

### Issue: 404 on GitHub Pages
**Checklist:**
- [ ] GitHub Pages enabled in settings
- [ ] `gh-pages` branch exists
- [ ] `index.html` in root of gh-pages
- [ ] Wait 1-2 minutes after push

### Issue: Assets not loading
**Solution:**
- Check browser console for errors
- Verify `base` in `vite.config.ts`:
  ```typescript
  export default {
    base: '/sre-synapse/'  // Must match repo name
  }
  ```

### Issue: API calls failing
**Checklist:**
- [ ] API key configured in UI
- [ ] Browser console shows request details
- [ ] Check CORS errors
- [ ] Verify Gemini API quota

## Rollback Procedures

### Rollback gh-pages
```bash
git checkout gh-pages
git reset --hard HEAD~1
git push origin gh-pages --force
git checkout main
```

### Rollback main branch
```bash
git reset --hard HEAD~1
git push origin main --force
```

### Rollback to specific commit
```bash
git log  # Find commit hash
git reset --hard <commit-hash>
git push origin <branch> --force
```

## Continuous Deployment

### Future Enhancement: GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

This will auto-deploy on every push to main.

## Security Best Practices

1. **Never commit sensitive data**:
   - `.env` is in `.gitignore`
   - API keys configured at runtime
   - User credentials in localStorage only

2. **Regular updates**:
   ```bash
   npm audit
   npm audit fix
   ```

3. **Branch protection**:
   - Enable branch protection for `main`
   - Require pull requests for changes
   - Require status checks

## Monitoring

### Check deployment status:
```bash
# View remote branches
git ls-remote --heads origin

# Check last deployment
git log gh-pages -1
```

### Verify site health:
1. Visit site URL
2. Open browser DevTools
3. Check Console for errors
4. Test login functionality
5. Upload test document
6. Verify chat interface

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review deployment scripts logs
3. Check GitHub Pages settings
4. Verify build succeeds locally: `npm run build`

## Summary

Your deployment should now be complete! 

✅ **Verification Checklist:**
- [ ] All branches pushed to GitHub
- [ ] gh-pages branch deployed
- [ ] Site accessible at GitHub Pages URL
- [ ] Login system functional
- [ ] Dashboard renders correctly
- [ ] File upload works
- [ ] Chat interface operational
- [ ] No console errors

🎉 **Success!** Your SRE Synapse application is now live!
