# Vercel Deployment - Quick Reference Card

## 📦 Build Commands & Output Directories

### FRONTEND (React + Vite)
```
Install:  npm install
Build:    npm run build
Output:   FE/build/
Node:     v18+ (recommended)
Runtime:  Node.js
```

### BACKEND (FastAPI)
```
Install:  pip install -r requirements.txt
Build:    pip install -r requirements.txt
Output:   . (root directory)
Python:   3.13
Runtime:  Python serverless
```

---

## 🔑 Key Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `vercel.json` | Frontend config | ✅ FIXED (outputs to FE/build) |
| `vercel-backend.json` | Backend config | ✅ OK |
| `api/index.py` | Backend entry point | ✅ OK |
| `FE/package.json` | Frontend scripts | ✅ OK |
| `FE/vite.config.ts` | Build config | ✅ OK (outDir: 'build') |
| `requirements.txt` | Python dependencies | ✅ OK |

---

## 🌍 Environment Variables

### Backend (Vercel → Settings → Environment Variables)
```
FRONTEND_URL = https://your-frontend-domain.vercel.app
```

### Frontend (Vercel → Settings → Environment Variables)
```
VITE_API_BASE_URL = https://your-backend-domain.vercel.app
```

---

## 🚀 Deployment Steps (In Order!)

### Step 1: Deploy Backend
```bash
cd /Users/swapneelpremchand/Paeon/Paeon-Med
vercel --config vercel-backend.json --prod
```
✅ Get backend URL: `https://paeon-backend-xxx.vercel.app`

### Step 2: Deploy Frontend
```bash
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE
vercel --prod
```
✅ Get frontend URL: `https://paeon-frontend-xxx.vercel.app`

### Step 3: Update Backend Env Vars
In Vercel Dashboard (Backend Project):
- Settings → Environment Variables
- Add: `FRONTEND_URL` = backend URL from Step 1
- Redeploy

### Step 4: Update Frontend Env Vars
In Vercel Dashboard (Frontend Project):
- Settings → Environment Variables
- Add: `VITE_API_BASE_URL` = backend URL from Step 1
- Redeploy

### Step 5: Test
```bash
# Visit frontend
https://your-frontend-xxx.vercel.app

# Test API call
curl https://your-backend-xxx.vercel.app/api/health
```

---

## 📊 Directory Structure for Deployment

```
Paeon-Med/
├── vercel.json                    ← Frontend config
├── vercel-backend.json            ← Backend config  
├── api/
│   └── index.py                   ← Backend entry point
├── main.py                        ← FastAPI app
├── requirements.txt               ← Python dependencies
├── FE/
│   ├── package.json               ← npm scripts
│   ├── vite.config.ts             ← Build config (outDir: 'build')
│   ├── src/                       ← React source
│   └── build/                     ← Generated on build
└── app/                           ← FastAPI routes/handlers
```

---

## ✅ Pre-Deployment Checklist

- [ ] `vercel.json` has `outputDirectory: FE/build`
- [ ] `FE/vite.config.ts` has `outDir: 'build'`
- [ ] `requirements.txt` updated with all dependencies
- [ ] `FE/package.json` build script: `"build": "vite build"`
- [ ] Backend tested locally: `uvicorn main:app --reload`
- [ ] Frontend tested locally: `npm run dev`
- [ ] `.env.example` has all required backend variables
- [ ] `FE/.env.production.example` has VITE_API_BASE_URL
- [ ] Git repo is up to date

---

## 🔧 Local Development

```bash
# Terminal 1: Backend
cd /Users/swapneelpremchand/Paeon/Paeon-Med
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Then:
- Frontend: http://localhost:3000 or http://localhost:5173
- Backend: http://localhost:8000
- Health check: http://localhost:8000/api/health

---

## 📞 Common Issues

| Issue | Solution |
|-------|----------|
| Build fails - build dir not found | Check `outputDirectory` in vercel.json matches vite.config.ts |
| CORS error | Ensure `FRONTEND_URL` is set in backend env vars |
| API 404 | Check `VITE_API_BASE_URL` in frontend env vars |
| Python deps fail | Verify all packages in requirements.txt work with Python 3.13 |
| Static files 404 | Ensure vite build outputs to correct directory |

---

## 🎯 Important Notes

1. **Deploy backend FIRST**, get URL, then deploy frontend
2. **Both projects need environment variables set in Vercel**
3. **Output directories must match between local config and vercel.json**
4. **Python 3.13** is specified in vercel-backend.json
5. **Node 18+** recommended for frontend
6. **FRONTEND_URL must include protocol** (`https://`, not just domain)

---

**Last Updated**: Feb 10, 2026  
**Status**: ✅ Ready to deploy
