# Vercel Deployment Guide for Paeon DMR

This guide provides step-by-step instructions for deploying the Paeon system to Vercel.

## Project Structure

Paeon has two main components that need to be deployed separately to Vercel:

1. **Frontend (React + Vite)** - Static site deployment
2. **Backend (FastAPI)** - Python serverless functions

## Prerequisites

- Vercel account (https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`
- Git repository synchronized with GitHub/GitLab

## Backend Deployment (FastAPI)

### Step 1: Deploy Backend to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Navigate to the backend directory
cd Paeon-Med

# Deploy using vercel-backend.json config
vercel --config vercel-backend.json
```

### Step 2: Configure Environment Variables

In the Vercel dashboard for your backend project:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

   - `FRONTEND_URL`: The URL of your deployed frontend (e.g., `https://paeon-fe.vercel.app`)
   - `GOOGLE_APPLICATION_CREDENTIALS`: Your Google Cloud credentials JSON (if needed)
   - Other API keys and secrets as required

3. Redeploy after adding environment variables

### Step 3: Verify Backend Deployment

```bash
# Test your backend health endpoint
curl https://your-backend-url.vercel.app/api/health
```

## Frontend Deployment (React + Vite)

### Step 1: Configure Backend URL in Frontend

Update your environment variables for the frontend to point to your deployed backend.

In `FE/.env.production`:
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app
```

Or set in Vercel dashboard:
- Go to **Settings** → **Environment Variables**
- Add `VITE_API_BASE_URL` pointing to your backend URL

### Step 2: Deploy Frontend to Vercel

```bash
# Navigate to the frontend directory
cd FE

# Deploy using Vercel
vercel

# For production deployment
vercel --prod
```

### Step 3: Verify Frontend Deployment

Visit your frontend URL and ensure it can communicate with the backend.

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (https://paeon-fe.vercel.app)                │
│  ├─ React + Vite application                           │
│  ├─ Static assets                                       │
│  └─ Proxied API requests to backend                    │
│                                                         │
│  Backend (https://paeon-backend.vercel.app)            │
│  ├─ FastAPI serverless functions                       │
│  ├─ CORS configured for frontend domain                │
│  └─ Connected to external services (GCP, etc.)         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Configuration Files

### `vercel.json` (Frontend)
- Specifies build command and output directory for React app
- Configures API rewrites to backend
- Sets environment variables

### `vercel-backend.json` (Backend)
- Python runtime configuration
- Build dependencies (pip)
- Environment variables for backend

### `api/index.py` (Backend Entry Point)
- Serverless function handler for Vercel
- Exports the FastAPI app instance

### `.vercelignore`
- Specifies files to exclude from deployments
- Prevents unnecessary files from being uploaded

## Environment Variables Reference

### Backend Required:
- `FRONTEND_URL` - URL of deployed frontend (for CORS)

### Frontend Required:
- `VITE_API_BASE_URL` - URL of deployed backend

## Monitoring and Logs

### View Logs:
```bash
# Backend logs
vercel logs your-backend-url.vercel.app

# Frontend logs
vercel logs your-frontend-url.vercel.app
```

### Dashboard:
- Visit https://vercel.com/dashboard
- Click on your project
- Go to **Logs** or **Functions** tab

## Common Issues and Solutions

### 1. CORS Errors
- Ensure `FRONTEND_URL` environment variable is set on backend
- Frontend URL must match exactly (including protocol)
- Restart/redeploy backend after changing

### 2. Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `requirements.txt` or `package.json`
- Verify Python version compatibility

### 3. Connection Timeouts
- Verify backend URL in frontend environment variables
- Check firewall/network policies
- Ensure both services are deployed and running

## Advanced Configuration

### Custom Domain
1. Go to project **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel

### Automatic Deployments
- Connect your Git repository
- Enable auto-deploy on push to main branch

### Preview Deployments
- Every pull request automatically gets a preview URL
- Great for testing before production

## Rollback

To rollback to a previous deployment:

```bash
# List all deployments
vercel deployments

# Rollback to specific deployment
vercel rollback <deployment-url>
```

## Cost Optimization

- Vercel offers generous free tier
- Monitor usage at https://vercel.com/pricing
- Set budget alerts in account settings

## Support

- Vercel Docs: https://vercel.com/docs
- FastAPI + Vercel: https://vercel.com/guides/deploying-python-with-vercel
- React + Vite: https://vercel.com/guides/deploying-vite

## Next Steps

1. Review and update environment variables
2. Test backend deployment with health endpoint
3. Deploy frontend and verify communication
4. Set up custom domains
5. Configure monitoring and alerts
