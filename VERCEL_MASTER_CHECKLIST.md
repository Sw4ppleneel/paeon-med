# VERCEL DEPLOYMENT - MASTER CHECKLIST & SETUP

## 🎯 COMPLETE SETUP AT A GLANCE

### FRONTEND
```
Install:  npm install
Build:    npm run build
Output:   FE/build/
Node:     18+
Env Var:  VITE_API_BASE_URL=https://your-backend.vercel.app
```

### BACKEND
```
Install:  pip install -r requirements.txt
Build:    pip install -r requirements.txt
Output:   . (root directory)
Python:   3.13
Env Var:  FRONTEND_URL=https://your-frontend.vercel.app
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Configuration Files (ALREADY DONE ✓)
- [x] `vercel.json` created (frontend config) - **FIXED to use FE/build**
- [x] `vercel-backend.json` created (backend config)
- [x] `api/index.py` created (backend entry point)
- [x] `.vercelignore` created (root optimization)
- [x] `FE/.vercelignore` created (frontend optimization)

### Environment Templates (ALREADY DONE ✓)
- [x] `.env.example` created
- [x] `FE/.env.local.example` created
- [x] `FE/.env.production.example` created

### Documentation (ALREADY DONE ✓)
- [x] `VERCEL_QUICK_START.md`
- [x] `VERCEL_DEPLOYMENT.md`
- [x] `VERCEL_SETUP_COMPLETE.md`
- [x] `VERCEL_FIX_AND_DEPLOY.md`
- [x] `VERCEL_QUICK_REFERENCE.md`
- [x] `VERCEL_BUILD_COMMANDS_VISUAL.md`
- [x] `VERCEL_SUMMARY.md`

### GitHub Actions (ALREADY DONE ✓)
- [x] `.github/workflows/vercel-deploy.yml` created

---

## 🚀 DEPLOYMENT CHECKLIST (WHAT YOU DO NOW)

### STEP 1: Create Environment Files
- [ ] Copy `.env.example` → `.env` and update
- [ ] Copy `FE/.env.local.example` → `FE/.env.local` and update
- [ ] Copy `FE/.env.production.example` → `FE/.env.production` and update

### STEP 2: Test Backend Locally
```bash
cd /Users/swapneelpremchand/Paeon/Paeon-Med
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- [ ] Backend starts without errors
- [ ] Can access http://localhost:8000/api/health (returns 200)
- [ ] Stop with Ctrl+C

### STEP 3: Test Frontend Locally
```bash
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```
- [ ] Frontend starts without errors
- [ ] Opens browser to http://localhost:5173
- [ ] Can build: `npm run build` creates `FE/build/`
- [ ] Stop with Ctrl+C

### STEP 4: Vercel Login
```bash
npm install -g vercel  # If not already installed
vercel login
vercel whoami  # Verify logged in
```
- [ ] Successfully logged into Vercel
- [ ] `vercel whoami` shows your email

### STEP 5: Deploy Backend
```bash
cd /Users/swapneelpremchand/Paeon/Paeon-Med
vercel --config vercel-backend.json --prod
```
- [ ] Deployment succeeds
- [ ] Note backend URL: `https://paeon-backend-xxx.vercel.app`
- [ ] Test health endpoint: `curl https://paeon-backend-xxx.vercel.app/api/health`

### STEP 6: Deploy Frontend
```bash
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE
vercel --prod
```
- [ ] Deployment succeeds
- [ ] Note frontend URL: `https://paeon-frontend-xxx.vercel.app`

### STEP 7: Set Environment Variables in Vercel
1. Go to https://vercel.com/dashboard
2. Backend project:
   - [ ] Settings → Environment Variables
   - [ ] Add: `FRONTEND_URL` = `https://paeon-frontend-xxx.vercel.app`
3. Frontend project:
   - [ ] Settings → Environment Variables
   - [ ] Add: `VITE_API_BASE_URL` = `https://paeon-backend-xxx.vercel.app`

### STEP 8: Redeploy Both Services
```bash
# Backend redeploy
cd /Users/swapneelpremchand/Paeon/Paeon-Med
vercel --config vercel-backend.json --prod

# Frontend redeploy
cd FE
vercel --prod
```
- [ ] Both redeploy successfully
- [ ] Environment variables now applied

### STEP 9: Verify Deployment
```bash
# Test API
curl https://paeon-backend-xxx.vercel.app/api/health

# Visit frontend in browser
https://paeon-frontend-xxx.vercel.app
```
- [ ] Backend health endpoint works
- [ ] Frontend loads in browser
- [ ] Open browser DevTools → Network
- [ ] Verify API calls succeed (no CORS errors)

---

## 📊 CONFIGURATION REFERENCE TABLE

| Component | Install | Build | Output | Entry Point | Config File |
|-----------|---------|-------|--------|-------------|-------------|
| Frontend | `npm i` | `npm run build` | `FE/build/` | `index.html` | `vercel.json` |
| Backend | `pip i` | `pip i` | `.` | `api/index.py` | `vercel-backend.json` |

---

## 🔑 KEY ENVIRONMENT VARIABLES

| Service | Var Name | Value | Set In |
|---------|----------|-------|--------|
| Backend | `FRONTEND_URL` | https://your-frontend.vercel.app | Vercel Dashboard |
| Frontend | `VITE_API_BASE_URL` | https://your-backend.vercel.app | Vercel Dashboard |

---

## 🗂️ FILE LOCATIONS & STATUS

```
/Users/swapneelpremchand/Paeon/Paeon-Med/
│
├── vercel.json                          ✅ FIXED (FE/build)
├── vercel-backend.json                  ✅ READY
├── .vercelignore                        ✅ READY
├── .env.example                         ✅ TEMPLATE
├── .env                                 ⏳ TO CREATE
├── api/
│   └── index.py                         ✅ READY
├── main.py                              ✅ READY
├── requirements.txt                     ✅ READY
│
├── FE/
│   ├── vercel.json (via parent)         ✅ READY
│   ├── .vercelignore                    ✅ READY
│   ├── .env.local.example               ✅ TEMPLATE
│   ├── .env.local                       ⏳ TO CREATE
│   ├── .env.production.example          ✅ TEMPLATE
│   ├── .env.production                  ⏳ TO CREATE
│   ├── package.json                     ✅ READY
│   ├── vite.config.ts                   ✅ READY (outDir: build)
│   └── src/                             ✅ READY
│
└── .github/
    └── workflows/
        └── vercel-deploy.yml            ✅ READY (optional)
```

---

## 🎬 QUICK COMMAND REFERENCE

```bash
# SETUP
npm install -g vercel
vercel login

# LOCAL TEST - BACKEND
cd /Users/swapneelpremchand/Paeon/Paeon-Med
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# LOCAL TEST - FRONTEND
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE
npm install
npm run dev

# LOCAL BUILD - FRONTEND
npm run build  # Creates FE/build/

# DEPLOY BACKEND
cd /Users/swapneelpremchand/Paeon/Paeon-Med
vercel --config vercel-backend.json --prod

# DEPLOY FRONTEND
cd /Users/swapneelpremchand/Paeon/Paeon-Med/FE
vercel --prod

# VIEW LOGS
vercel logs https://paeon-backend-xxx.vercel.app
vercel logs https://paeon-frontend-xxx.vercel.app
```

---

## ⚠️ IMPORTANT NOTES

1. **Output Directory Mismatch - FIXED ✅**
   - vite.config.ts: `outDir: 'build'`
   - vercel.json: `outputDirectory: "FE/build"`
   - ✅ Both now point to `FE/build/`

2. **Deploy Order Matters**
   - Deploy backend FIRST → get URL
   - Deploy frontend SECOND → get URL
   - Update backend env vars with frontend URL
   - Redeploy both

3. **Environment Variables**
   - Frontend env: Set in Vercel dashboard (not in git)
   - Backend env: Set in Vercel dashboard (not in git)
   - `.env` files are for local development only

4. **Python Version**
   - vercel-backend.json specifies Python 3.13
   - Ensure requirements.txt packages support 3.13

5. **Node Version**
   - Frontend uses Node 18+ (default)
   - Check FE/package.json for node version requirement

---

## 🆘 TROUBLESHOOTING QUICK LINKS

**Issue**: Build fails  
→ Check: `VERCEL_BUILD_COMMANDS_VISUAL.md`

**Issue**: CORS errors  
→ Check: `VERCEL_SETUP_COMPLETE.md` (search "CORS")

**Issue**: API 404  
→ Check: `VERCEL_FIX_AND_DEPLOY.md` (Step 7 env vars)

**Issue**: Frontend can't connect to backend  
→ Check: `VERCEL_QUICK_REFERENCE.md` (Common Issues)

**Issue**: Deployment stuck  
→ Check: `VERCEL_FIX_AND_DEPLOY.md` (Debug section)

---

## 📈 EXPECTED OUTCOMES

After completing all steps, you'll have:

✅ **Frontend Deployed**
- URL: https://paeon-frontend-xxx.vercel.app
- Running on Vercel CDN
- VITE_API_BASE_URL configured

✅ **Backend Deployed**
- URL: https://paeon-backend-xxx.vercel.app
- Running as serverless function
- FRONTEND_URL configured

✅ **Services Connected**
- Frontend can call backend API
- CORS enabled for both domains
- No API errors in browser console

✅ **CI/CD Ready** (Optional)
- GitHub Actions workflow ready
- Auto-deploy on push
- Staging and production environments

---

## 🎉 YOU'RE ALL SET!

All configuration files are in place. Follow the **DEPLOYMENT CHECKLIST** above and you'll be live in no time!

**Need Help?**
1. Read the relevant guide from the documentation files
2. Check the troubleshooting section
3. Verify environment variables are set correctly
4. Test locally first before deploying

**Current Status**: ✅ Ready to deploy!

---

Last Updated: February 10, 2026
