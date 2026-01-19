# Deployment Guide - Call Analytics Dashboard

Complete guide to deploy the Active Wellness Call Analytics Dashboard to production.

---

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git installed
- Vercel account (free tier works)
- API credentials for:
  - n8n instance
  - VAPI account
  - GoHighLevel (optional)

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd n8n-admin-app
npm install
```

This installs:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts (charts)
- date-fns (date formatting)

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
# n8n API Configuration
N8N_API_URL=https://awsperth.app.n8n.cloud/api/v1
N8N_API_KEY=your_n8n_api_key_here

# VAPI Configuration
VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key

# GoHighLevel Configuration (optional)
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_ghl_location_id
```

**How to get API keys:**

**n8n API Key:**
1. Log into your n8n instance
2. Go to Settings → API
3. Create a new API key
4. Copy the key (starts with `n8n_api_`)

**VAPI Keys:**
1. Log into [vapi.ai](https://vapi.ai)
2. Go to Dashboard → API Keys
3. Copy Public Key and Private Key

**GoHighLevel API Key:**
1. Log into GoHighLevel
2. Go to Settings → API
3. Create API key with required permissions

### 3. Test API Connections

Run the test script:

```bash
node test-api.js
```

Expected output:
```
=== Dashboard API Test ===

=== Environment Variables Check ===

✅ N8N_API_URL: https://awsperth.app...
✅ N8N_API_KEY: eyJhbGciOiJIUzI1NiI...
✅ VAPI_PUBLIC_KEY: 46b01045-7bc6-464f...
✅ VAPI_PRIVATE_KEY: 9da190dd-bd4b-47cd...
✅ GHL_API_KEY: pit-4071aa9d-c90c-4...
✅ GHL_LOCATION_ID: lAUNjMwLwNZbldhmj1...

=== API Connection Tests ===

Testing n8n API connection...
✅ n8n API connection successful
   Found 1 executions

Testing VAPI API connection...
✅ VAPI API connection successful
   Found 5 calls

=== Summary ===
Environment: ✅
n8n API: ✅
VAPI API: ✅

🎉 All systems ready! Dashboard should work correctly.
```

If any tests fail, double-check your API keys and network connection.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

You should see:
- Loading spinner (briefly)
- Dashboard with metrics, charts, and gamification sidebar
- Real data from n8n and VAPI (if available)

**Verify:**
- ✅ Metrics cards show numbers
- ✅ Charts render correctly
- ✅ Activity table has entries
- ✅ Gamification sidebar shows progress
- ✅ Refresh button works
- ✅ Auto-refresh after 30 seconds

---

## Production Deployment (Vercel)

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Login to Vercel:**

```bash
vercel login
```

3. **Deploy:**

```bash
cd n8n-admin-app
vercel
```

Follow prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? **active-wellness-dashboard**
- Directory? **./  (current directory)**
- Override settings? **No**

4. **Add Environment Variables:**

After initial deployment:

```bash
vercel env add N8N_API_URL
vercel env add N8N_API_KEY
vercel env add VAPI_PUBLIC_KEY
vercel env add VAPI_PRIVATE_KEY
vercel env add GHL_API_KEY
vercel env add GHL_LOCATION_ID
```

For each variable:
- Environment: **Production**
- Paste the value when prompted

5. **Redeploy with environment variables:**

```bash
vercel --prod
```

Your dashboard is now live at: `https://active-wellness-dashboard.vercel.app`

### Option 2: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub:**

```bash
cd n8n-admin-app
git init
git add .
git commit -m "Initial commit - Call Analytics Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/active-wellness-dashboard.git
git push -u origin main
```

2. **Connect to Vercel:**

- Go to [vercel.com](https://vercel.com)
- Click "Add New Project"
- Import your GitHub repository
- Click "Import"

3. **Configure Project:**

- Framework Preset: **Next.js** (auto-detected)
- Root Directory: **n8n-admin-app** (if repo has multiple folders)
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)

4. **Add Environment Variables:**

Click "Environment Variables" and add:

```
N8N_API_URL = https://awsperth.app.n8n.cloud/api/v1
N8N_API_KEY = your_actual_key
VAPI_PUBLIC_KEY = your_actual_key
VAPI_PRIVATE_KEY = your_actual_key
GHL_API_KEY = your_actual_key
GHL_LOCATION_ID = your_actual_id
```

For each variable, select:
- **Production**, **Preview**, and **Development** environments

5. **Deploy:**

Click "Deploy"

Wait for build to complete (1-2 minutes).

6. **Access Dashboard:**

Open the provided URL: `https://your-project.vercel.app/dashboard`

---

## Custom Domain Setup

### Add Custom Domain to Vercel

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `dashboard.activewellness.com.au`)

4. **Add DNS Records:**

Go to your domain registrar (Namecheap, GoDaddy, etc.) and add:

**For subdomain (dashboard.activewellness.com.au):**
- Type: `CNAME`
- Name: `dashboard`
- Value: `cname.vercel-dns.com`

**For root domain (activewellness.com.au):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

5. **Wait for verification** (can take up to 48 hours, usually 5-10 minutes)

6. **Enable HTTPS:**

Vercel automatically provisions SSL certificate from Let's Encrypt.

Your dashboard is now at: `https://dashboard.activewellness.com.au/dashboard`

---

## Post-Deployment Configuration

### 1. Set Homepage to Dashboard

If you want `/` to redirect to `/dashboard`:

Edit `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
}
```

Or update the home page link:

```typescript
// app/page.tsx
<a href="/dashboard" className="...">
  View Dashboard
</a>
```

### 2. Add Authentication (Optional)

To restrict dashboard access:

**Option A: Basic Auth via Vercel**

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/dashboard(.*)",
      "headers": [
        {
          "key": "WWW-Authenticate",
          "value": "Basic realm=\"Dashboard\""
        }
      ]
    }
  ]
}
```

Then add middleware for auth check.

**Option B: NextAuth.js**

```bash
npm install next-auth
```

Follow [NextAuth.js docs](https://next-auth.js.org) for setup.

**Option C: Clerk or Auth0**

Use a hosted auth service for easier setup.

### 3. Add Analytics (Optional)

**Vercel Analytics:**

```bash
npm install @vercel/analytics
```

Update `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Google Analytics:**

Add to `app/layout.tsx` in `<head>`:

```typescript
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

---

## Monitoring & Maintenance

### Check Application Logs

**Vercel Dashboard:**
- Go to your project
- Click "Deployments" → Latest deployment
- Click "Functions" → View logs

**Common issues:**
- API connection failures → Check environment variables
- Rate limiting → Check API usage limits
- Slow responses → Check n8n/VAPI performance

### Set Up Alerts

**Vercel Monitoring:**
- Go to Settings → Monitoring
- Configure alerts for:
  - Error rate threshold
  - Response time threshold
  - Failed deployments

**External Monitoring (Recommended):**

Use [UptimeRobot](https://uptimerobot.com) (free):
1. Add monitor for `https://your-domain.com/dashboard`
2. Check interval: 5 minutes
3. Alert via email/SMS/Slack

### Performance Optimization

**Enable Caching:**

Already implemented:
- Server-side: 1-minute cache on `/api/analytics/dashboard`
- Client-side: 30-second polling interval

**Increase cache duration (optional):**

Edit `app/api/analytics/dashboard/route.ts`:

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes instead of 1
```

**Add Redis caching (advanced):**

For high-traffic scenarios, use Vercel KV or Upstash Redis.

### Update Dashboard

**Automatic deployments (if using GitHub):**
1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically deploys

**Manual deployment:**
```bash
vercel --prod
```

---

## Troubleshooting

### Issue: Dashboard shows "Failed to load"

**Cause:** API connection failure

**Fix:**
1. Check Vercel logs for specific error
2. Verify environment variables are set correctly
3. Test API endpoints manually:
   ```bash
   curl -H "X-N8N-API-KEY: your_key" https://awsperth.app.n8n.cloud/api/v1/executions
   ```
4. Check if APIs are accessible from Vercel (not blocked by firewall)

### Issue: Charts not rendering

**Cause:** Build error or missing dependencies

**Fix:**
1. Check build logs in Vercel
2. Ensure `recharts` is in `package.json` dependencies (not devDependencies)
3. Rebuild:
   ```bash
   npm install
   npm run build
   ```

### Issue: Slow dashboard loading

**Cause:** API response time

**Fix:**
1. Check n8n/VAPI API response times
2. Increase cache duration
3. Reduce data fetched (limit to last 100 executions)
4. Consider using pagination

### Issue: Data not updating

**Cause:** Cache or stale data

**Fix:**
1. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
2. Check if polling is working (should auto-refresh every 30s)
3. Click manual refresh button
4. Clear cache in `app/api/analytics/dashboard/route.ts`

### Issue: Dark mode not working

**Cause:** Tailwind config issue

**Fix:**
1. Verify `tailwind.config.ts` has `darkMode: 'class'`
2. Check if `<html>` has `dark` class
3. Use browser dev tools to toggle dark mode

---

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel environment variables for production
- ✅ Rotate API keys regularly
- ✅ Use separate keys for dev/staging/prod

### 2. API Key Protection

- ✅ Keep API keys server-side only (in API routes)
- ✅ Never expose in client-side code
- ✅ Use `NEXT_PUBLIC_` prefix only for truly public keys

### 3. Rate Limiting

Add rate limiting to API routes:

```typescript
// app/api/analytics/dashboard/route.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

### 4. CORS Configuration

Restrict API access to your domain:

```typescript
// app/api/analytics/dashboard/route.ts
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  if (origin !== 'https://your-domain.com') {
    return new Response('Forbidden', { status: 403 });
  }
  // ... rest of code
}
```

---

## Scaling Considerations

### Current Setup (Good for 0-10K users)

- Server-side caching (1 minute)
- Client-side polling (30 seconds)
- Vercel serverless functions

### Medium Scale (10K-100K users)

Add:
- Redis caching (Upstash or Vercel KV)
- Increase cache to 5 minutes
- Add CDN for static assets
- Database for historical data

### Large Scale (100K+ users)

Consider:
- Dedicated backend server (not serverless)
- WebSocket for real-time updates (instead of polling)
- Database replication
- Load balancing
- Separate analytics service

---

## Backup & Disaster Recovery

### Data Backup

Dashboard doesn't store data (reads from n8n/VAPI), but backup:

1. **Code backup:** Git repository (already done)
2. **Environment variables:** Export from Vercel or keep in password manager
3. **Configuration:** Document all settings

### Recovery Plan

If dashboard goes down:

1. **Check Vercel status:** [status.vercel.com](https://status.vercel.com)
2. **Rollback deployment:** Vercel Dashboard → Deployments → Rollback to last working version
3. **Deploy to backup service:** Can deploy same code to Netlify, Railway, or Render

### Monitoring Checklist

- [ ] Uptime monitoring configured
- [ ] Error alerting enabled
- [ ] Performance monitoring active
- [ ] SSL certificate expiry alerts
- [ ] API quota monitoring (n8n, VAPI)

---

## Cost Estimation

### Free Tier (Vercel)

- **Bandwidth:** 100 GB/month
- **Invocations:** 100K serverless function invocations/month
- **Build time:** 6000 minutes/month

**Estimated usage:**
- ~1000 users/month = ~50K API calls = **Free**
- 10K users/month = ~500K API calls = **$20-40/month**

### Paid Tiers

**Vercel Pro ($20/month):**
- 1TB bandwidth
- 1M serverless invocations
- Analytics included

**Vercel Enterprise (Custom pricing):**
- Unlimited bandwidth
- Unlimited invocations
- Priority support

### External API Costs

**n8n Cloud:**
- Free tier: 20K workflow executions/month
- Starter: $20/month for 120K executions

**VAPI:**
- Pay-per-use: ~$0.10/minute of calls
- Check [vapi.ai/pricing](https://vapi.ai/pricing)

---

## Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Recharts Docs](https://recharts.org)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Community
- Next.js Discord
- Vercel Community
- Stack Overflow

### Maintenance Contacts
- n8n Support: [n8n.io/support](https://n8n.io/support)
- VAPI Support: [vapi.ai/support](https://vapi.ai/support)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

---

## Summary

**Deployment Steps:**

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env.local` with API keys
3. ✅ Test locally: `npm run dev`
4. ✅ Push to GitHub
5. ✅ Connect to Vercel
6. ✅ Add environment variables in Vercel
7. ✅ Deploy
8. ✅ Add custom domain (optional)
9. ✅ Set up monitoring
10. ✅ Go live! 🚀

**Production URL:** `https://your-project.vercel.app/dashboard`

**Custom Domain:** `https://dashboard.activewellness.com.au/dashboard`

Your Call Analytics Dashboard is now live and ready for use!
