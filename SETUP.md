# Setup & Deployment Guide

Complete step-by-step guide to get your n8n admin app running locally and deployed to production.

---

## Quick Start (Local Development)

### Step 1: Install Node.js

If you don't have Node.js installed:

**macOS** (using Homebrew):
```bash
brew install node
```

**Or download from**: [nodejs.org](https://nodejs.org/) (v18 or higher)

Verify installation:
```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

### Step 2: Install Dependencies

```bash
cd n8n-admin-app
npm install
```

This will install all required packages:
- Next.js
- React
- TypeScript
- Tailwind CSS
- And other dependencies

### Step 3: Verify Environment Variables

The `.env.local` file is already configured with your n8n webhook URLs:

```env
NEXT_PUBLIC_N8N_WEBHOOK_BASE=https://awsperth.app.n8n.cloud/webhook
NEXT_PUBLIC_PHONE_VALIDATION_PATH=/validate-phone-and-call
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000)

You should see the Phone Validation form!

### Step 5: Test the App

1. Enter a test phone number (e.g., "0412345678")
2. Optionally add name and email
3. Click "Validate Phone"
4. You should see a success message indicating the workflow was triggered

---

## Production Deployment to Vercel

Vercel is the recommended platform for deploying Next.js apps (free tier available).

### Method 1: Deploy via GitHub (Recommended)

#### Step 1: Create GitHub Repository

1. **Go to GitHub** and create a new repository:
   - Name: `n8n-admin-app` (or your choice)
   - Visibility: Private (recommended for business apps)

2. **Initialize git** in your project (if not already done):
   ```bash
   cd n8n-admin-app
   git init
   git add .
   git commit -m "Initial commit: n8n admin app"
   ```

3. **Add remote and push**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/n8n-admin-app.git
   git push -u origin main
   ```

#### Step 2: Connect to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login (use GitHub account)

2. **Click "Add New Project"**

3. **Import your GitHub repository**:
   - Click "Import" next to your repository
   - Vercel will auto-detect Next.js configuration

4. **Configure Environment Variables**:
   - Before deploying, add these environment variables in Vercel:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_N8N_WEBHOOK_BASE` | `https://awsperth.app.n8n.cloud/webhook` |
   | `NEXT_PUBLIC_PHONE_VALIDATION_PATH` | `/validate-phone-and-call` |

5. **Click "Deploy"**

   Vercel will:
   - Install dependencies
   - Build your app
   - Deploy to a production URL
   - Typical deploy time: 2-3 minutes

6. **Access your app**:
   - URL will be: `https://your-app-name.vercel.app`
   - You'll also get a custom domain option

#### Step 3: Test Production Deployment

1. Visit your Vercel URL
2. Test the phone validation form
3. Verify it works the same as local development

---

### Method 2: Deploy via Vercel CLI

If you prefer command-line deployment:

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Deploy

```bash
cd n8n-admin-app
vercel
```

Follow the interactive prompts:
- Setup and deploy: **Yes**
- Which scope: **Your account**
- Link to existing project: **No**
- Project name: **n8n-admin-app** (or your choice)
- Directory: **./** (default)
- Want to override settings: **No**

Vercel will deploy and give you a URL.

#### Step 4: Add Environment Variables

```bash
vercel env add NEXT_PUBLIC_N8N_WEBHOOK_BASE
# Enter: https://awsperth.app.n8n.cloud/webhook
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_PHONE_VALIDATION_PATH
# Enter: /validate-phone-and-call
# Select: Production, Preview, Development
```

#### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

---

## Custom Domain Setup (Optional)

### Add Custom Domain in Vercel

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `admin.activewellness.com.au`)
4. Follow DNS configuration instructions
5. Vercel will auto-provision SSL certificate

### DNS Configuration

Add these records to your domain's DNS:

**For root domain** (example.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain** (admin.example.com):
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

Wait 5-10 minutes for DNS propagation, then your app will be live on your custom domain!

---

## Continuous Deployment

Once connected to GitHub, Vercel automatically deploys:

- **Main branch** → Production deployment
- **Other branches** → Preview deployments
- **Pull requests** → Preview deployments with unique URL

### Workflow:

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push
   ```
3. Vercel automatically builds and deploys
4. You get a notification when deployment is complete

---

## Monitoring & Analytics

### Vercel Dashboard

Monitor your app:
- **Analytics**: Page views, visitors, performance
- **Logs**: Real-time function logs
- **Deployments**: History of all deployments
- **Speed Insights**: Core Web Vitals

Access: [vercel.com/dashboard](https://vercel.com/dashboard)

### n8n Workflow Monitoring

Monitor workflow executions:
1. Go to n8n dashboard: https://awsperth.app.n8n.cloud
2. Click on workflow
3. View "Executions" tab
4. See all webhook calls and results

---

## Troubleshooting

### Issue: "npm install" fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Build fails on Vercel

**Solution**:
1. Check build logs in Vercel dashboard
2. Test build locally:
   ```bash
   npm run build
   ```
3. Fix any TypeScript errors
4. Commit and push fixes

### Issue: Environment variables not working

**Solution**:
1. Verify variables are set in Vercel dashboard
2. Make sure they're selected for "Production"
3. Redeploy:
   ```bash
   vercel --prod
   ```

### Issue: Webhook returns CORS error

**Solution**:
The API route acts as a proxy to avoid CORS issues. If you still see errors:
1. Check that the API route (`/api/validate-phone`) is being used
2. Don't call n8n webhook directly from frontend
3. All requests should go through Next.js API routes

### Issue: Phone validation not working

**Solution**:
1. Verify n8n workflow is active:
   - Go to n8n dashboard
   - Check "2.Phone Validation & Lead Scoring w" is active
2. Test webhook directly:
   ```bash
   curl -X POST https://awsperth.app.n8n.cloud/webhook/validate-phone-and-call \
     -H "Content-Type: application/json" \
     -d '{"phone": "+61412345678"}'
   ```
3. Check n8n execution logs for errors

---

## Next Steps

### Enhance the App

1. **Add More Workflows**:
   - Lead Capture form
   - Call Management dashboard
   - Analytics view

2. **Improve UI**:
   - Add loading animations
   - Better error messages
   - Results visualization

3. **Add Features**:
   - Lead history tracking
   - Export to CSV
   - Search and filter

### Modify n8n Workflows

To get detailed validation results (instead of just acknowledgment):

1. See `../WORKFLOWS.md` for modification instructions
2. Update workflow to return validation details
3. Update frontend to display detailed results

---

## Cost Breakdown

### Free Tier (Sufficient for MVP)

- **Vercel**: Free tier includes:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Serverless functions
  - SSL certificates
  - Analytics (basic)

- **n8n Cloud**: Your existing plan

### If You Need More (Pro Tier)

**Vercel Pro** ($20/month):
- 1TB bandwidth
- Advanced analytics
- Team collaboration
- Priority support

**When to upgrade**:
- High traffic (>100GB bandwidth/month)
- Need team features
- Want advanced analytics

---

## Security Best Practices

### Environment Variables

✅ **Do**:
- Store in `.env.local` for local dev
- Add to Vercel for production
- Use `NEXT_PUBLIC_` prefix only for client-side vars

❌ **Don't**:
- Commit `.env.local` to git (already in `.gitignore`)
- Expose sensitive keys in frontend code
- Share API keys publicly

### n8n Webhooks

Consider adding authentication to your n8n webhooks before production:

1. In n8n, configure webhook authentication
2. Add API key to environment variables
3. Update API route to include authentication header

---

## Support & Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [n8n Docs](https://docs.n8n.io)

### Your Project Docs

- `README.md` - Project overview
- `../WORKFLOWS.md` - n8n API documentation
- `../WORKFLOW_ANALYSIS.md` - Workflow analysis
- `../RECOMMENDATIONS.md` - Implementation guide

---

## Checklist

### Local Development
- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Dev server running (`npm run dev`)
- [ ] App accessible at localhost:3000
- [ ] Phone validation form working

### Production Deployment
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added in Vercel
- [ ] Deployment successful
- [ ] Production URL accessible
- [ ] Phone validation tested in production

### Optional Enhancements
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] n8n workflows enhanced with detailed responses
- [ ] Additional workflows integrated
- [ ] Team members added (if needed)

---

**Congratulations!** Your n8n admin app is ready to use! 🎉

For questions or issues, refer to the troubleshooting section or check the related documentation.
