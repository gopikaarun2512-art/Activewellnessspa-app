# Dashboard Setup Guide

## Current Status

✅ **Completed**:
- Package.json updated with recharts and date-fns
- Type definitions created (analytics.ts, gamification.ts)
- Project structure planned

⏳ **Next Steps**: Follow this guide to complete the dashboard

---

## Step 1: Install Dependencies

```bash
cd "/Users/arunbahul/Documents/Agentic Workflows/n8n to App/n8n-admin-app"
npm install
```

This will install the new dependencies (recharts, date-fns).

---

## Step 2: Set Up Environment Variables

Add these to `.env.local`:

```env
# n8n API (already configured)
N8N_API_URL=https://awsperth.app.n8n.cloud/api/v1
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwYmVhYS04ODFmLTQ3YTktOWYwNi1jZmY0NzQ5MGI0MjgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3OTkxNjE0fQ.ccAr_leTkW6CgH8cO2bK39o-XG5PuWNyr91SqYbH5NE

# Google Sheets API (you need to get these)
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CALL_QUEUE_ID=your-sheet-id
GOOGLE_SHEETS_LEADS_ID=your-sheet-id
GOOGLE_SHEETS_BOOKINGS_ID=your-sheet-id

# GoHighLevel API (you need to get this)
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-location-id

# VAPI API (you need to get this)
VAPI_API_KEY=your-vapi-api-key
VAPI_ORG_ID=your-org-id
```

### How to Get API Keys:

**Google Sheets**:
1. Go to Google Cloud Console
2. Create service account
3. Download JSON key file
4. Share your Google Sheets with the service account email

**GoHighLevel**:
1. Go to GHL Settings → Integrations → API
2. Generate API key
3. Get your Location ID from the URL or API

**VAPI**:
1. Log into VAPI dashboard
2. Go to Settings → API Keys
3. Create new API key

---

## Step 3: File Structure (Already Created)

✅ These files have been created:
- `types/analytics.ts` - Analytics type definitions
- `types/gamification.ts` - Gamification types and constants
- `package.json` - Updated with dependencies

📝 **Remaining Files to Create** (I can create these for you):

### API Routes (Backend)
1. `app/api/analytics/dashboard/route.ts` - Main unified endpoint
2. `app/api/analytics/n8n-executions/route.ts` - n8n data
3. `app/api/analytics/google-sheets/route.ts` - Google Sheets
4. `app/api/analytics/ghl-contacts/route.ts` - GoHighLevel
5. `app/api/analytics/vapi-calls/route.ts` - VAPI

### Library/Utils
1. `lib/n8n-client.ts` - n8n API wrapper
2. `lib/google-sheets-client.ts` - Google Sheets client
3. `lib/ghl-client.ts` - GoHighLevel client
4. `lib/vapi-client.ts` - VAPI client
5. `lib/analytics-aggregator.ts` - Data aggregation logic
6. `lib/gamification.ts` - Gamification calculations

### Components (Frontend)
1. `app/dashboard/page.tsx` - Main dashboard page
2. `app/dashboard/layout.tsx` - Dashboard layout
3. `components/dashboard/DashboardHeader.tsx`
4. `components/dashboard/MetricsCard.tsx`
5. `components/dashboard/MetricsGrid.tsx`
6. `components/dashboard/CallVolumeChart.tsx`
7. `components/dashboard/CallOutcomesChart.tsx`
8. `components/dashboard/RecentActivityTable.tsx`
9. `components/dashboard/GamificationSidebar.tsx`
10. `components/dashboard/DailyGoalsTracker.tsx`
11. `components/dashboard/LevelDisplay.tsx`
12. `components/dashboard/AchievementsBadges.tsx`

---

## Step 4: Development Approach

### Option 1: I Can Complete Everything (Recommended)

Let me know when you:
1. Have run `npm install` successfully
2. Have added the API keys to `.env.local`

Then I'll create all the remaining files (API routes, components, utilities).

### Option 2: Build with Mock Data First

Start with mock/dummy data to build the UI, then connect real APIs later.

Benefits:
- See the dashboard immediately
- Test UI/UX without API dependencies
- Add real data integration progressively

---

## Step 5: Running the Dashboard

After all files are created:

```bash
npm run dev
```

Then visit:
- Main app: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

---

## Design Preview

The dashboard will have:

### Main Content (Left Side - 70%)
- 4 metric cards showing key stats
- Bar chart (inbound vs outbound calls by hour)
- Pie chart (call outcomes breakdown)
- Recent activity table

### Gamification Sidebar (Right Side - 30%)
- Daily goals with progress bars
- Level display with progress to next level
- Achievement badges (unlocked + locked)

### Design Style
- Clean, minimal, professional
- Subtle shadows (not heavy)
- Consistent spacing (4px grid)
- Smooth animations
- NOT "AI-generated" looking

---

## Next Actions

**Tell me when you want to proceed and I'll:**

1. ✅ Create all API route files
2. ✅ Create all utility/library files
3. ✅ Create all dashboard components
4. ✅ Wire everything together
5. ✅ Add mock data for testing (if APIs aren't ready)

**Or, if you prefer:**

- Start with mock data dashboard (see UI immediately)
- Build one piece at a time
- Custom approach

---

## Questions?

Let me know:
1. Do you have the API keys ready?
2. Should I create everything now or wait?
3. Want to start with mock data first?
4. Any specific changes to the plan?

---

**Status**: Ready to continue building the dashboard! 🚀
