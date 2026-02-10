# VERCEL SETUP - BUILD COMMANDS & DIRECTORIES (VISUAL GUIDE)

## 📊 Side-by-Side Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
├─────────────────────────────────────────────────────────────┤
│ Location:        FE/ folder                                 │
│ Type:            React + Vite (Node.js)                     │
│                                                             │
│ Install Command: npm install                               │
│ Build Command:   npm run build                             │
│ Output Dir:      FE/build/                                 │
│                                                             │
│ vercel.json:     "outputDirectory": "FE/build"            │
│ vite.config.ts:  outDir: 'build'                          │
│                                                             │
│ Runtime:         Node.js                                   │
│ Node Version:    18+                                        │
│                                                             │
│ Environment Var: VITE_API_BASE_URL                         │
│ Example:         https://backend.vercel.app               │
└─────────────────────────────────────────────────────────────┘
           ↓
     ┌─────────────┐
     │ npm install │  Install all dependencies
     └─────────────┘
           ↓
     ┌─────────────────────────────────────┐
     │ npm run build (= vite build)        │  Compile React app
     └─────────────────────────────────────┘
           ↓
     ┌──────────────────┐
     │ FE/build/ ✓ GENERATED
     │ ├─ index.html
     │ ├─ assets/
     │ │  ├─ main.xxxxx.js
     │ │  ├─ style.xxxxx.css
     │ │  └─ ...
     │ └─ ...
     └──────────────────┘
           ↓
     ┌──────────────────────────────────┐
     │ Upload to Vercel CDN             │
     │ Serve at: vercel.app domain      │
     └──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
├─────────────────────────────────────────────────────────────┤
│ Location:        Paeon-Med/ root folder                     │
│ Type:            FastAPI (Python)                           │
│                                                             │
│ Install Command: pip install -r requirements.txt           │
│ Build Command:   pip install -r requirements.txt           │
│ Output Dir:      . (current/root directory)                │
│                                                             │
│ vercel-backend.json: "outputDirectory": "."               │
│                                                             │
│ Runtime:         Python 3.13 Serverless                    │
│ Entry Point:     api/index.py                             │
│                                                             │
│ Environment Var: FRONTEND_URL                              │
│ Example:         https://frontend.vercel.app              │
└─────────────────────────────────────────────────────────────┘
           ↓
     ┌──────────────────────────────┐
     │ pip install -r requirements  │  Install Python deps
     └──────────────────────────────┘
           ↓
     ┌──────────────────────────┐
     │ api/index.py detected    │  Vercel recognizes serverless function
     └──────────────────────────┘
           ↓
     ┌──────────────────────────────┐
     │ Imports from main.py         │  FastAPI app
     │ from main import app         │
     └──────────────────────────────┘
           ↓
     ┌──────────────────────────────┐
     │ Deploy as serverless         │
     │ function                     │
     └──────────────────────────────┘
           ↓
     ┌──────────────────────────────┐
     │ API endpoint live at:        │
     │ https://api.vercel.app       │
     └──────────────────────────────┘
```

---

## 📋 Configuration Matrix

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Install** | `npm install` | `pip install -r requirements.txt` |
| **Build** | `npm run build` | `pip install -r requirements.txt` |
| **Output** | `FE/build/` | `.` (root) |
| **Entry Point** | `FE/index.html` | `api/index.py` |
| **Runtime** | Node.js 18+ | Python 3.13 |
| **Deploy Type** | Static site | Serverless function |
| **Vercel Config** | `vercel.json` | `vercel-backend.json` |
| **Main App File** | `FE/src/main.tsx` | `main.py` |
| **Build Tool** | Vite | pip/Python |
| **Server** | CDN | ASGI (Uvicorn) |

---

## 🔄 Build Flow Diagram

```
YOUR CODE
   ↓
   ├─ Frontend (FE/)
   │  ├─ package.json
   │  ├─ src/ (React components)
   │  └─ vite.config.ts (outDir: 'build')
   │     ↓
   │  Run: npm install && npm run build
   │     ↓
   │  Output: FE/build/ (static files)
   │     ↓
   │  Vercel reads: vercel.json → "outputDirectory": "FE/build"
   │     ↓
   │  Deploy: Static files to CDN
   │     ↓
   │  Live: https://paeon-fe.vercel.app
   │
   └─ Backend (Paeon-Med/)
      ├─ requirements.txt
      ├─ main.py (FastAPI app)
      ├─ api/index.py (entry point)
      └─ vercel-backend.json
         ↓
      Run: pip install -r requirements.txt
         ↓
      Output: . (all code in root)
         ↓
      Vercel reads: api/index.py & main.py
         ↓
      Deploy: Serverless function
         ↓
      Live: https://paeon-be.vercel.app
```

---

## 🎯 The 3 Critical Matches

### Match #1: Output Directory
```
vite.config.ts:          outDir: 'build'
                              ↓
vercel.json: "outputDirectory": "FE/build"

✅ CORRECT - They match!
```

### Match #2: Build Scripts
```
package.json:  "build": "vite build"
                              ↓
vercel.json: "buildCommand": "cd FE && npm install && npm run build"

✅ CORRECT - Calls npm run build
```

### Match #3: Entry Point
```
main.py:      FastAPI app instance
                    ↓
api/index.py: from main import app

✅ CORRECT - Entry point imports main.py
```

---

## 📦 Local vs Vercel - Commands

### Local Development

```bash
# Frontend
cd FE
npm install
npm run dev  # Starts dev server at localhost:5173

# Backend
cd Paeon-Med
pip install -r requirements.txt
uvicorn main:app --reload  # Starts at localhost:8000
```

### Vercel Production Build

```bash
# Frontend (what Vercel runs)
cd FE
npm install
npm run build
# Produces: FE/build/

# Backend (what Vercel runs)
pip install -r requirements.txt
# Vercel uses api/index.py as entry point
```

---

## 🔧 All Files You Need

```
✅ FRONTEND SETUP:
   - FE/package.json                 (has "build": "vite build")
   - FE/vite.config.ts               (has outDir: 'build')
   - FE/src/                         (React source code)
   - vercel.json                     (root, frontend config)
   - FE/.vercelignore                (optional, optimization)
   - FE/.env.production.example      (template)

✅ BACKEND SETUP:
   - main.py                         (FastAPI app)
   - requirements.txt                (Python packages)
   - api/index.py                    (Vercel entry point)
   - vercel-backend.json             (backend config)
   - .vercelignore                   (optional, optimization)
   - .env.example                    (template)

❌ DO NOT NEED:
   - .next/ (not Next.js)
   - dist/ (using build/ instead)
   - node_modules/ (rebuilt on Vercel)
```

---

## 💡 Quick Reference Commands

```bash
# TEST LOCALLY
npm run dev          # Frontend dev server
uvicorn main:app --reload  # Backend dev server

# BUILD LOCALLY
npm run build        # Frontend: creates FE/build/
pip install -r requirements.txt  # Backend: installs packages

# DEPLOY TO VERCEL
vercel login
vercel --config vercel-backend.json --prod  # Backend
cd FE && vercel --prod                      # Frontend

# CHECK WHAT'S GENERATED
ls FE/build/         # Should see index.html + assets/
ls api/              # Should see index.py
```

---

## ⚙️ Environment Variables

### Set in Vercel Dashboard (Settings → Environment Variables)

**Backend Project:**
```
Name:  FRONTEND_URL
Value: https://your-frontend-domain.vercel.app
Scope: Production
```

**Frontend Project:**
```
Name:  VITE_API_BASE_URL
Value: https://your-backend-domain.vercel.app
Scope: Production
```

---

## ✅ Checklist - Everything You Need

- [ ] `npm install` works in FE/
- [ ] `npm run build` creates FE/build/ folder
- [ ] `pip install -r requirements.txt` works in Paeon-Med/
- [ ] `uvicorn main:app --reload` starts backend at port 8000
- [ ] Frontend vite.config.ts has `outDir: 'build'`
- [ ] vercel.json has `outputDirectory: "FE/build"`
- [ ] api/index.py exists in root
- [ ] api/index.py imports main.py
- [ ] requirements.txt has all packages
- [ ] vercel-backend.json configured correctly
- [ ] Environment templates created (.env.example, etc)
- [ ] Logged in to Vercel: `vercel login`
- [ ] Ready to deploy!

---

**Status**: ✅ All configurations aligned and ready!
