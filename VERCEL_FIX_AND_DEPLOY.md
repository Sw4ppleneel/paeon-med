# Vercel Deployment - Fix & Deploy Guide

## 🔴 Why Your Last Deployment Failed

When you ran: `vercel --config vercel-backend.json`

The issue was likely one of these:

1. **Not authenticated with Vercel**
   ```bash
   vercel login
   # Follow the login flow
   ```

2. **Wrong directory**
   - Make sure you're in `/Users/swapneelpremchand/Paeon/Paeon-Med`
   - `vercel --config vercel-backend.json` reads configs from current directory

3. **Missing dependencies**
   - Ensure `requirements.txt` has all packages
   - Check no package versions conflict with Python 3.13

4. **Environment issues**
   - Missing environment variables not set in Vercel dashboard
   - Run locally first to verify it works

---

## ✅ Correct Deployment Process (Step-by-Step)

### Phase 1: Pre-Deployment Setup

```bash
# Step 1: Navigate to project
cd /Users/swapneelpremchand/Paeon/Paeon-Med

# Step 2: Verify configuration files exist
ls -la vercel.json              # Should exist
ls -la vercel-backend.json      # Should exist
ls -la api/index.py             # Should exist
ls -la requirements.txt         # Should exist
ls -la FE/package.json          # Should exist
```

### Phase 2: Test Locally (IMPORTANT!)

**Backend Test:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, test health endpoint
curl http://localhost:8000/api/health
# Should return 200 OK
```

**Frontend Test:**
```bash
cd FE

# Install dependencies
npm install

# Set API URL for local development
export VITE_API_BASE_URL=http://localhost:8000

# Run dev server
npm run dev

# Browser should open to http://localhost:5173 or http://localhost:3000
```

### Phase 3: Vercel CLI Setup

```bash
# Step 1: Install Vercel CLI globally (if not already)
npm install -g vercel

# Step 2: Authenticate with Vercel
vercel login
# You'll be redirected to browser to confirm
# Select "Continue with GitHub" or your auth method
```

### Phase 4: Deploy Backend

```bash
# Make sure you're in the project root
cd /Users/swapneelpremchand/Paeon/Paeon-Med

# Deploy backend using config file
vercel --config vercel-backend.json --prod

# You'll be prompted:
# - Set project name: paeon-backend (or your choice)
# - Link to existing project: choose "N" for first deploy
# - After deployment, note the URL:
#   https://paeon-backend-xxxxx.vercel.app
```

### Phase 5: Configure Backend Environment Variables

**Option A: Using Vercel CLI**
```bash
# Add FRONTEND_URL variable (you'll set this after frontend deploy)
vercel env add FRONTEND_URL
# Paste your frontend URL when prompted
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Find your backend project: "paeon-backend"
3. Click Settings → Environment Variables
4. Add new variable:
   - Name: `FRONTEND_URL`
   - Value: (leave empty for now, update after frontend deploy)
   - Apply to: Production

### Phase 6: Deploy Frontend

```bash
# Navigate to frontend
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE

# Deploy frontend
vercel --prod

# You'll be prompted for project setup
# After deployment, note the URL:
#   https://paeon-frontend-xxxxx.vercel.app
```

### Phase 7: Configure Frontend Environment Variables

**Using Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Find your frontend project: "paeon-frontend" or similar
3. Click Settings → Environment Variables
4. Add new variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://paeon-backend-xxxxx.vercel.app` (from Phase 4)
   - Apply to: Production

### Phase 8: Update Backend Environment Variables (Complete the Loop)

1. Go to https://vercel.com/dashboard
2. Find your backend project
3. Go to Settings → Environment Variables
4. Update `FRONTEND_URL`:
   - Value: `https://paeon-frontend-xxxxx.vercel.app` (from Phase 6)

### Phase 9: Trigger Redeployment (Both Services)

After setting environment variables, redeploy both:

```bash
# Redeploy backend
cd /Users/swapneelpremchand/Paeon/Paeon-Med
vercel --config vercel-backend.json --prod

# Redeploy frontend
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE
vercel --prod
```

### Phase 10: Verify Deployment

```bash
# Test backend health endpoint
curl https://paeon-backend-xxxxx.vercel.app/api/health

# Visit frontend in browser
https://paeon-frontend-xxxxx.vercel.app

# Check browser console for any API errors
# Make a test API call from frontend
```

---

## 📋 Configuration Files Status

### vercel.json (Frontend Config)
```json
{
  "buildCommand": "cd FE && npm install && npm run build",
  "outputDirectory": "FE/build",
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url"
  }
}
```
✅ Status: CORRECT (fixed to use FE/build)

### vercel-backend.json (Backend Config)
```json
{
  "buildCommand": "pip install -r requirements.txt",
  "outputDirectory": ".",
  "framework": "python",
  "runtime": "python@3.13",
  "env": {
    "FRONTEND_URL": "@frontend_url"
  }
}
```
✅ Status: CORRECT

### api/index.py (Backend Entry Point)
```python
from main import app
```
✅ Status: CORRECT

### FE/vite.config.ts (Frontend Build Config)
```typescript
build: {
  target: 'esnext',
  outDir: 'build',  // ✅ Matches vercel.json outputDirectory
}
```
✅ Status: CORRECT

### requirements.txt (Backend Dependencies)
```
fastapi>=0.110.0
uvicorn>=0.27.0
pydantic>=2.0.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
google-genai>=1.0.0
python-dotenv>=1.0.0
```
✅ Status: CORRECT

### FE/package.json (Frontend Build Script)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```
✅ Status: CORRECT

---

## 🎯 Quick Deploy Summary

```
LOCAL TESTING
    ↓
BACKEND: pip install → uvicorn main:app → test /api/health ✓
    ↓
FRONTEND: npm install → npm run build → vite dev ✓
    ↓
VERCEL LOGIN
    ↓
DEPLOY BACKEND
  - vercel --config vercel-backend.json --prod
  - Get URL: https://paeon-backend-xxx.vercel.app
    ↓
DEPLOY FRONTEND
  - vercel --prod
  - Get URL: https://paeon-frontend-xxx.vercel.app
    ↓
SET ENVIRONMENT VARIABLES
  - Backend: FRONTEND_URL = frontend URL
  - Frontend: VITE_API_BASE_URL = backend URL
    ↓
REDEPLOY BOTH SERVICES
    ↓
VERIFY IN BROWSER
  - Visit frontend URL
  - Check console for API errors
  - Test API endpoint
```

---

## 🆘 If Deployment Still Fails

### Debug Step 1: Check Vercel Login
```bash
vercel whoami
# Should show your email/account
```

### Debug Step 2: Verify Project Directory
```bash
pwd
# Should show: /Users/swapneelpremchand/Paeon/Paeon-Med
```

### Debug Step 3: Check File Existence
```bash
ls -la vercel.json
ls -la vercel-backend.json
ls -la api/index.py
ls -la requirements.txt
ls -la FE/package.json
# All should exist
```

### Debug Step 4: Test Build Locally
```bash
# Backend
pip install -r requirements.txt
python -c "from main import app; print('Backend OK')"

# Frontend
cd FE
npm install
npm run build
# Check if FE/build/ directory was created
```

### Debug Step 5: Check Vercel CLI Version
```bash
vercel --version
# Update if needed: npm install -g vercel@latest
```

---

## 📞 Command Reference

| Command | Purpose |
|---------|---------|
| `vercel login` | Authenticate with Vercel |
| `vercel logout` | Sign out |
| `vercel whoami` | Check current user |
| `vercel --config vercel-backend.json --prod` | Deploy backend |
| `vercel --prod` (in FE/) | Deploy frontend |
| `vercel env add NAME` | Add env variable |
| `vercel logs URL` | View deployment logs |
| `vercel deployments` | List all deployments |
| `vercel rollback URL` | Rollback to previous deploy |

---

## ✅ Final Checklist Before Deploy

- [ ] Backend works locally: `uvicorn main:app --reload`
- [ ] Frontend works locally: `npm run dev`
- [ ] All files exist: vercel.json, vercel-backend.json, api/index.py
- [ ] Logged in: `vercel whoami` shows your account
- [ ] In correct directory: `/Users/swapneelpremchand/Paeon/Paeon-Med`
- [ ] requirements.txt has all packages
- [ ] FE/package.json has build script
- [ ] vite.config.ts has `outDir: 'build'`
- [ ] vercel.json has `outputDirectory: FE/build`
- [ ] Ready to deploy!

---

**Next Step**: Follow the "Correct Deployment Process" section above, starting from Phase 1.
