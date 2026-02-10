# Quick Start: Vercel Deployment Setup

## What's Been Added

Your project now has complete Vercel support with the following files:

```
Paeon-Med/
├── vercel.json                          # Frontend (React) build config
├── vercel-backend.json                  # Backend (FastAPI) build config
├── .vercelignore                        # Files to exclude from deployment
├── api/
│   └── index.py                         # Python serverless function handler
├── FE/
│   ├── .vercelignore                    # Frontend-specific ignore rules
│   ├── .env.local.example               # Local dev environment template
│   └── .env.production.example          # Production environment template
├── .env.example                         # Backend environment template
├── VERCEL_DEPLOYMENT.md                 # Full deployment guide
└── .github/
    └── workflows/
        └── vercel-deploy.yml            # GitHub Actions CI/CD pipeline
```

## Quick Setup Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Create Environment Files

**Frontend:**
```bash
cp FE/.env.local.example FE/.env.local
# Update with your local backend URL
```

**Backend:**
```bash
cp .env.example .env
# Add your environment variables
```

### 3. Test Locally

```bash
# Terminal 1: Backend
cd Paeon-Med
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2: Frontend
cd FE
npm install
npm run dev
```

### 4. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended for first-time)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. For Backend:
   - Select `Paeon-Med` as root directory
   - Override build command: `pip install -r requirements.txt`
   - Set environment variables from `.env.example`
5. For Frontend:
   - Select `Paeon-Med/FE` as root directory
   - Set `VITE_API_BASE_URL` environment variable

#### Option B: Using Vercel CLI

```bash
# Deploy backend
cd Paeon-Med
vercel --config vercel-backend.json --prod

# Deploy frontend
cd FE
vercel --prod
```

### 5. Set Up GitHub Actions (Optional)

Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VERCEL_TOKEN`: Get from https://vercel.com/account/tokens
   - `VERCEL_ORG_ID`: Found in Vercel dashboard
   - `VERCEL_PROJECT_ID_BACKEND`: Backend project ID
   - `VERCEL_PROJECT_ID_FRONTEND`: Frontend project ID

### 6. Configure Environment Variables in Vercel

**Backend Project:**
- `FRONTEND_URL`: Your frontend Vercel URL (e.g., `https://paeon-fe.vercel.app`)
- Add any other required env vars from `.env.example`

**Frontend Project:**
- `VITE_API_BASE_URL`: Your backend Vercel URL (e.g., `https://paeon-backend.vercel.app`)

### 7. Verify Deployment

```bash
# Test backend health endpoint
curl https://your-backend-url.vercel.app/api/health

# Visit frontend
# https://your-frontend-url.vercel.app
```

## Common Next Steps

1. **Custom Domain Setup**
   - Go to project Settings → Domains
   - Add your custom domain
   - Update DNS records

2. **Enable Auto-Deploy**
   - Connect Git repository
   - Auto-deploy on main branch push

3. **Set Up Monitoring**
   - Use Vercel Analytics
   - Configure error tracking
   - Set up alerts

4. **Optimize Performance**
   - Use Vercel's edge functions
   - Configure caching headers
   - Implement CDN optimization

## Deployment Architecture

```
GitHub Repository
    ↓
Push to main/dev
    ↓
GitHub Actions Trigger
    ↓
    ├─→ Deploy Backend (FastAPI)
    │   ↓
    │   Vercel Python Runtime
    │   ↓
    │   Serverless Functions (api/index.py)
    │
    └─→ Deploy Frontend (React + Vite)
        ↓
        Vercel Static Hosting
        ↓
        CDN Distribution
```

## File Guide

- **`vercel.json`** - Frontend build and deployment configuration
- **`vercel-backend.json`** - Backend Python runtime configuration
- **`api/index.py`** - Entry point for Vercel serverless functions
- **`.vercelignore`** - Reduce build size by excluding unnecessary files
- **`VERCEL_DEPLOYMENT.md`** - Comprehensive deployment guide
- **`.github/workflows/vercel-deploy.yml`** - Automated CI/CD pipeline

## Troubleshooting

### Build Failures
- Check Vercel dashboard logs
- Verify all dependencies in `requirements.txt` or `package.json`
- Ensure Python version compatibility

### CORS Issues
- Verify `FRONTEND_URL` is set correctly on backend
- Ensure URLs include protocol (https://, not just domain)
- Check CORS configuration in `main.py`

### Missing Environment Variables
- Add all variables to Vercel project settings
- Restart/redeploy after adding
- Check variable names match code references

### Connection Errors
- Verify backend URL in `VITE_API_BASE_URL`
- Check network connectivity
- Ensure both services are deployed

## Resources

- [Vercel Python Support](https://vercel.com/docs/functions/python)
- [Vercel React/Vite Guide](https://vercel.com/docs/frameworks/vite)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/concepts/)
- [GitHub Actions with Vercel](https://vercel.com/guides/github-actions)

## Support

For issues or questions:
1. Check `VERCEL_DEPLOYMENT.md` for detailed guides
2. Review Vercel documentation
3. Check GitHub Actions logs
4. Verify environment variables and build settings

---

**Status**: ✅ Vercel support fully configured and ready to deploy!
