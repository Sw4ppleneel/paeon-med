# Vercel Deployment - Complete Setup Guide

## 🔧 Build Commands, Install Commands & Output Directories

### FRONTEND (React + Vite)

| Aspect | Details |
|--------|---------|
| **Install Command** | `npm install` |
| **Build Command** | `npm run build` (runs `vite build`) |
| **Output Directory** | `build` (as configured in vite.config.ts) |
| **Root Directory** | `FE` |
| **Node Version** | 18+ (recommended 18 or 20) |
| **Package Manager** | npm |

#### Frontend Scripts (from package.json):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

#### Vite Configuration (vite.config.ts):
```typescript
build: {
  target: 'esnext',
  outDir: 'build',  // ⚠️ NOTE: This outputs to 'build', not 'dist'
}
```

⚠️ **IMPORTANT**: Your vite.config.ts specifies `outDir: 'build'`, but vercel.json references `FE/dist`. This is a mismatch that needs fixing!

---

### BACKEND (FastAPI + Python)

| Aspect | Details |
|--------|---------|
| **Install Command** | `pip install -r requirements.txt` |
| **Build Command** | `pip install -r requirements.txt` (same as install) |
| **Output Directory** | `.` (current directory - project root) |
| **Python Version** | 3.13 (as configured in vercel-backend.json) |
| **Framework** | FastAPI |
| **Server** | Uvicorn |

#### Dependencies (requirements.txt):
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

---

## ✅ Complete Setup Checklist

### Step 1: Fix Frontend Configuration

**Problem**: vite.config.ts outputs to `build`, but vercel.json expects `dist`

**Solution**: Update vercel.json to match vite.config.ts OR change vite.config.ts to output to `dist`

**Option A** (Recommended - Update vercel.json):
```json
{
  "buildCommand": "cd FE && npm install && npm run build",
  "outputDirectory": "FE/build",
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url"
  }
}
```

**Option B** (Update vite.config.ts):
```typescript
build: {
  target: 'esnext',
  outDir: 'dist',  // Change from 'build' to 'dist'
}
```

### Step 2: Fix Frontend Environment Variables

Current `.env.production.example`:
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app
```

In Vercel Dashboard, set:
- Go to: Settings → Environment Variables
- Add: `VITE_API_BASE_URL` = `https://your-backend-domain.vercel.app`
- Apply to: Production

### Step 3: Configure Backend Environment Variables

Your backend (main.py) reads from environment variables. In Vercel Dashboard:
- Go to: Backend project → Settings → Environment Variables
- Add: `FRONTEND_URL` = `https://your-frontend-domain.vercel.app`
- Add any other required vars from `.env.example`

### Step 4: Verify Backend Entry Point

File: `api/index.py`
```python
from main import app
# Vercel automatically uses this 'app' instance
```

This should work as-is. Vercel will:
1. Install dependencies with: `pip install -r requirements.txt`
2. Run `api/index.py` as the ASGI handler
3. Expose the FastAPI app

### Step 5: Test Locally

**Backend**:
```bash
cd Paeon-Med
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then test: `curl http://localhost:8000/api/health`

**Frontend**:
```bash
cd FE
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

---

## 🚀 Vercel Configuration Files (UPDATED)

### vercel.json (Frontend - ROOT OF PAEON-MED)

Replace current file with:

```json
{
  "buildCommand": "cd FE && npm install && npm run build",
  "outputDirectory": "FE/build",
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url"
  }
}
```

### vercel-backend.json (Backend)

Current file is correct:

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

---

## 📋 Complete Deployment Workflow

### Using Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy Backend (from Paeon-Med root)
cd Paeon-Med
vercel --config vercel-backend.json --prod

# Note the backend URL, e.g., https://paeon-backend.vercel.app

# 3. Set environment variables for backend project
# In Vercel dashboard or via CLI:
# FRONTEND_URL=https://paeon-frontend.vercel.app (set this after frontend deployment)

# 4. Deploy Frontend
cd FE
vercel --prod

# Note the frontend URL, e.g., https://paeon-frontend.vercel.app

# 5. Go back to backend and update FRONTEND_URL environment variable
# In Vercel dashboard: Backend project → Settings → Environment Variables
# Set FRONTEND_URL to the frontend URL from step 4
```

### Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repo

**For Backend Project**:
- Framework: Python
- Root Directory: `Paeon-Med`
- Build Command: `pip install -r requirements.txt`
- Output Directory: `.`
- Environment Variables:
  - `FRONTEND_URL` = (set after frontend deployment)

**For Frontend Project**:
- Root Directory: `Paeon-Med/FE`
- Build Command: `npm install && npm run build`
- Output Directory: `build`
- Framework: Vite
- Environment Variables:
  - `VITE_API_BASE_URL` = (set after backend deployment)

---

## 🔍 What Gets Deployed

### Backend (api/index.py)
```
Input: main.py + app/ folder + requirements.txt
         ↓
    [pip install -r requirements.txt]
         ↓
Vercel Python Runtime (3.13)
         ↓
Output: Serverless Function at https://your-backend-url.vercel.app
```

### Frontend (FE folder)
```
Input: src/ + package.json + vite.config.ts
         ↓
    [npm install && npm run build]
         ↓
Vite Build Process
         ↓
Output: Static files in FE/build/ deployed to CDN
         ↓
Served at: https://your-frontend-url.vercel.app
```

---

## 🆘 Troubleshooting

### 1. Build fails with "build directory not found"
**Solution**: Update outputDirectory in vercel.json to match vite.config.ts outDir

### 2. CORS errors in console
**Solution**: 
- Set `FRONTEND_URL` on backend to exact frontend URL
- Include protocol: `https://paeon.vercel.app` not `paeon.vercel.app`
- Redeploy backend

### 3. Frontend can't connect to backend
**Solution**:
- Check `VITE_API_BASE_URL` environment variable is set
- Verify it points to correct backend URL
- Check network tab in browser DevTools

### 4. Python dependencies not installing
**Solution**:
- Check `requirements.txt` has all needed packages
- Verify package versions are compatible
- Check Python 3.13 compatibility

### 5. "api/index.py not found" error
**Solution**:
- Ensure file exists at `/Paeon-Med/api/index.py`
- File should import FastAPI app from main.py

---

## 📝 Environment Variables Summary

### Backend (.env or Vercel Settings):
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (.env or Vercel Settings):
```
VITE_API_BASE_URL=https://your-backend-domain.vercel.app
```

---

## ⚡ Quick Command Reference

```bash
# Install dependencies locally
cd Paeon-Med && pip install -r requirements.txt
cd FE && npm install

# Run locally
cd Paeon-Med && uvicorn main:app --reload
cd FE && npm run dev

# Build for production
cd FE && npm run build  # outputs to ./build

# Deploy to Vercel
vercel --config vercel-backend.json --prod  # backend
cd FE && vercel --prod  # frontend
```

---

## ✅ Status Checklist

- [ ] Fix vercel.json outputDirectory to `FE/build`
- [ ] Ensure vite.config.ts outDir is `build`
- [ ] Set VITE_API_BASE_URL in frontend env vars
- [ ] Set FRONTEND_URL in backend env vars
- [ ] Test backend locally with `uvicorn main:app --reload`
- [ ] Test frontend locally with `npm run dev`
- [ ] Deploy backend first
- [ ] Deploy frontend second
- [ ] Update backend FRONTEND_URL env var to frontend URL
- [ ] Test CORS by calling API from frontend
- [ ] Set up custom domains (optional)
