# Vercel Deployment Guide
## Active Wellness Spa - Call Analytics Dashboard

### 🚀 Quick Deployment Steps

Your code is ready at: https://github.com/gopikaarun2512-art/Activewellnessspa-app

---

## Step 1: Go to Vercel

Visit: **[vercel.com](https://vercel.com)**

---

## Step 2: Sign In

- Click "Sign In" or "Sign Up"
- Choose **"Continue with GitHub"**
- Authorize Vercel to access your GitHub account

---

## Step 3: Import Your Project

1. Click **"Add New..."** button (top right corner)
2. Select **"Project"**
3. In the import screen, find: **"Activewellnessspa-app"**
4. Click **"Import"**

---

## Step 4: Configure Build Settings

Vercel should auto-detect these (verify they are correct):

- ✅ **Framework Preset**: Next.js
- ✅ **Root Directory**: `./`
- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `.next`
- ✅ **Install Command**: `npm install`

**→ No changes needed here, just verify these are detected**

---

## Step 5: Add Environment Variables ⚠️ CRITICAL

Click **"Environment Variables"** section and add these 6 variables:

### Variable 1
```
Name: N8N_API_URL
Value: https://awsperth.app.n8n.cloud/api/v1
Environment: Production, Preview, Development (select all)
```

### Variable 2
```
Name: N8N_API_KEY
Value: [YOUR ACTUAL N8N API KEY - copy from your local .env.local file]
Environment: Production, Preview, Development (select all)
```

### Variable 3
```
Name: GOOGLE_SHEETS_CLIENT_EMAIL
Value: [YOUR SERVICE ACCOUNT EMAIL - copy from your local .env.local file]
Environment: Production, Preview, Development (select all)
```

### Variable 4
```
Name: GOOGLE_SHEETS_PRIVATE_KEY
Value: [YOUR PRIVATE KEY WITH QUOTES - copy from your local .env.local file]
Environment: Production, Preview, Development (select all)
```
**Important**: Include the quotes and keep `\n` as literal `\n` (not actual line breaks)

### Variable 5
```
Name: GHL_API_KEY
Value: [YOUR GOHIGHLEVEL API KEY - copy from your local .env.local file]
Environment: Production, Preview, Development (select all)
```

### Variable 6
```
Name: VAPI_API_KEY
Value: [YOUR VAPI API KEY - copy from your local .env.local file]
Environment: Production, Preview, Development (select all)
```

---

## Step 6: Deploy

1. Double-check all 6 environment variables are added
2. Click the **"Deploy"** button
3. Wait 2-5 minutes for the build to complete
4. Watch the build logs (they'll show in real-time)

---

## Step 7: Get Your Live URL

Once deployment succeeds (you'll see "Congratulations!"), you'll get:

- **Production URL**: `https://activewellnessspa-app.vercel.app` (or similar)
- Click "Visit" to open your live dashboard

---

## Post-Deployment Checklist

- [ ] Dashboard loads without errors
- [ ] Call metrics are displayed
- [ ] Charts render correctly
- [ ] Data refreshes (check after 30 seconds)
- [ ] Dark mode toggle works
- [ ] Search functionality works
- [ ] Mobile responsive view works

---

## Troubleshooting

### Build Fails
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set correctly
3. Ensure `GOOGLE_SHEETS_PRIVATE_KEY` has proper formatting

### Dashboard Loads But No Data
1. Verify n8n API URL and key are correct
2. Check n8n workflows are active
3. Verify Google Sheets credentials have access to sheets
4. Check browser console for API errors

### Environment Variable Issues
1. Go to Project Settings → Environment Variables
2. Edit any incorrect values
3. Redeploy by going to Deployments → three dots → Redeploy

---

## Auto-Deploy Enabled

✅ **Every push to GitHub `main` branch will automatically deploy!**

To make changes:
1. Edit code locally
2. Commit: `git add . && git commit -m "your message"`
3. Push: `git push origin main`
4. Vercel automatically builds and deploys

---

## Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain name
4. Follow DNS configuration instructions

---

## Support

If you encounter any issues:
- View build logs: Project → Deployments → Click deployment
- Check runtime logs: Project → Deployments → Function Logs
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)

---

## Your Project Links

- **GitHub**: https://github.com/gopikaarun2512-art/Activewellnessspa-app
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Live URL**: (will appear after deployment)

---

**Good luck with your deployment! 🎉**
