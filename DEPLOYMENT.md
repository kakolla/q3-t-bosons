# OptiMED-Q Deployment Guide

## Overview
This guide helps you deploy the OptiMED-Q quantum optimization application with:
- **Frontend**: Vercel (static hosting)
- **Backend**: Railway (Python/Flask hosting)

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free tier available)

## Step 1: Deploy Backend to Railway

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `q3-t-bosons` repository
   - Railway will automatically detect it's a Python app and use the `railway.json` config
   - Wait for deployment (takes 5-10 minutes due to quantum computing dependencies)
   - Copy the deployed URL (e.g., `https://your-app-name.railway.app`)

## Step 2: Update Frontend for Production

3. **Update API endpoint in frontend**:
   - Edit `frontend/script.js`
   - Replace `'/run_knapsack'` with your Railway URL + `/run_knapsack`
   - Example: `'https://your-app-name.railway.app/run_knapsack'`

## Step 3: Deploy Frontend to Vercel

4. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `q3-t-bosons` repository
   - Set build settings:
     - Framework Preset: "Other"
     - Root Directory: `frontend`
     - Build Command: (leave empty)
     - Output Directory: (leave empty)
   - Deploy!

## Alternative: Railway for Both Frontend + Backend

If you prefer to host everything on Railway:
- Railway will serve both the API and static files
- No need to update the frontend API URLs
- Single deployment, simpler setup

## Environment Variables (if needed)

For Railway deployment, you may need to set:
- `PYTHONPATH=/app`
- `PORT=8080` (usually auto-detected)

## Files Created for Deployment

- `requirements.txt` - Python dependencies
- `Procfile` - Heroku-style process file
- `railway.json` - Railway configuration
- `runtime.txt` - Python version specification
- `vercel.json` - Vercel routing configuration
- Added CORS support to Flask app

## Testing

After deployment:
1. Test the Railway backend directly: `https://your-app.railway.app/run_knapsack`
2. Test the full application on Vercel
3. Verify quantum optimization works in production

## Troubleshooting

- **Build fails**: Check Railway logs for missing dependencies
- **CORS errors**: Ensure Flask-CORS is properly configured
- **Quantum imports fail**: Railway should handle the complex quantum dependencies automatically
- **Timeout errors**: Quantum computations may take longer in production
