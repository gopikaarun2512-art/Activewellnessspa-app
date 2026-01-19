# Facebook Leads Feature

**Date**: January 19, 2026
**Version**: 2.2
**Status**: ✅ Complete

---

## 🎯 Overview

Added Facebook lead form submission tracking to the Call Analytics Dashboard, allowing agents to view and manage leads captured from Facebook ads and page forms in real-time.

---

## ✨ What Was Added

### 1. Facebook Leads Data Structure

**New Interface**: `FacebookLead`

```typescript
export interface FacebookLead {
  id: string;
  formId: string;
  formName?: string;
  createdTime: string;
  name: string;
  email?: string;
  phone?: string;
  adId?: string;
  adName?: string;
  status: 'new' | 'contacted' | 'qualified' | 'booked' | 'not_interested';
  source: 'facebook_ad' | 'facebook_page';
  customFields?: Record<string, string>;
}
```

### 2. Facebook Leads Client

**New File**: `lib/facebook-leads-client.ts`

Fetches Facebook lead data from n8n workflow executions:
- Automatically finds Facebook leads workflow
- Fetches today's successful executions
- Extracts lead information from workflow data
- Handles various field name formats
- Normalizes status values
- Returns sorted list (most recent first)

### 3. Facebook Leads Panel Component

**New File**: `components/dashboard/FacebookLeadsPanel.tsx`

Features:
- **Header Section**: Facebook icon, lead count
- **Lead Cards**: Display individual leads with:
  - Name and status badge
  - Source badge (FB Ad / FB Page)
  - Contact details (email, phone)
  - Form and ad information
  - Timestamp
  - Expandable custom fields
- **Summary Footer**: Quick stats by status
- **Empty State**: Friendly message when no leads
- **Responsive Design**: Mobile-friendly layout

---

## 🎨 Visual Design

### Status Badges

| Status | Color | Label |
|--------|-------|-------|
| `new` | Blue | New |
| `contacted` | Wellness Blue | Contacted |
| `qualified` | Purple | Qualified |
| `booked` | Wellness Success Green | Booked |
| `not_interested` | Gray | Not Interested |

### Source Badges

| Source | Color | Label |
|--------|-------|-------|
| `facebook_ad` | Blue | FB Ad |
| `facebook_page` | Indigo | FB Page |

### Card Layout

```
┌─────────────────────────────────────────────────┐
│ 🔵 Facebook Icon    Facebook Leads              │
│                     X form submissions today     │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📋 John Doe [New] [FB Ad]          2:30 PM     │
│    📧 john@example.com              Jan 19      │
│    📞 +61 427 123 456                          │
│    📄 Contact Form → Summer Sale Ad             │
│    ▸ View custom fields                         │
│                                                 │
├─────────────────────────────────────────────────┤
│ • 2 Booked  • 3 New  • 1 Qualified  Total: 6   │
└─────────────────────────────────────────────────┘
```

---

## 📋 Data Flow

### 1. n8n Workflow Structure

The Facebook leads client expects workflows with this structure:

```
Webhook (Facebook Leadgen)
  → Process Lead Data
    → Store/Route Lead
      → Respond
```

### 2. Data Extraction

The client looks for these field names (in order of priority):

**Lead ID**:
- `json.id`

**Form Info**:
- `json.form_id` or `json.formId`
- `json.form_name` or `json.formName`

**Contact Info**:
- `json.name`, `json.full_name`, or `json.firstName + json.lastName`
- `json.email`
- `json.phone` or `json.phone_number`

**Ad Info**:
- `json.ad_id` or `json.adId`
- `json.ad_name` or `json.adName`

**Status**:
- `json.status` or `json.lead_status`

**Custom Fields**:
- `json.field_data` or `json.customFields`

### 3. Status Normalization

The client automatically normalizes status values:
- Contains "contact" → `contacted`
- Contains "qualif" → `qualified`
- Contains "book" → `booked`
- Contains "not" or "reject" → `not_interested`
- Default → `new`

---

## 🔧 Technical Implementation

### Files Created

1. **[lib/facebook-leads-client.ts](lib/facebook-leads-client.ts)**
   - FacebookLeadsClient class
   - getTodaysLeads() method
   - extractLeadFromExecution() method
   - normalizeStatus() helper

2. **[components/dashboard/FacebookLeadsPanel.tsx](components/dashboard/FacebookLeadsPanel.tsx)**
   - FacebookLeadsPanel component
   - Status badge renderer
   - Source badge renderer
   - Custom fields collapsible section

### Files Modified

1. **[types/analytics.ts](types/analytics.ts)**
   - Added `FacebookLead` interface
   - Updated `DashboardData` to include `facebookLeads: FacebookLead[]`

2. **[lib/analytics-aggregator.ts](lib/analytics-aggregator.ts)**
   - Imported `facebookLeadsClient`
   - Added `FacebookLead` to imports
   - Updated `getDashboardData()` to fetch Facebook leads in parallel
   - Added `facebookLeads` to return object

3. **[app/dashboard/page.tsx](app/dashboard/page.tsx)**
   - Imported `FacebookLeadsPanel`
   - Added `<FacebookLeadsPanel facebookLeads={data.dashboard.facebookLeads} />`

---

## 📊 Integration Points

### Dashboard API Route

The `/api/analytics/dashboard` endpoint now returns:

```typescript
{
  dashboard: {
    metrics: { ... },
    callVolume: [ ... ],
    outcomes: [ ... ],
    recentActivity: [ ... ],
    queuedCalls: [ ... ],
    facebookLeads: [      // ← NEW!
      {
        id: "123",
        formId: "456",
        name: "John Doe",
        email: "john@example.com",
        status: "new",
        source: "facebook_ad",
        createdTime: "2026-01-19T14:30:00Z"
      }
    ],
    lastUpdated: "..."
  },
  gamification: { ... }
}
```

### Dashboard Layout

The Facebook Leads Panel is positioned:
- **Desktop**: Below Queued Calls Panel, above Recent Activity Table
- **Mobile**: Full width in same order

---

## 🌟 Features Breakdown

### Lead Card Features

**Basic Information**:
- Lead name (bold, truncated if long)
- Status badge (color-coded)
- Source badge (FB Ad / FB Page)

**Contact Details**:
- Email with envelope icon
- Phone with phone icon
- Both use monospace font for readability

**Form & Ad Context**:
- Form name with document icon
- Ad name with ad icon
- Helps identify lead source

**Timing**:
- Time submitted (h:mm a format)
- Date (MMM d format)

**Custom Fields**:
- Collapsible details section
- Shows any additional fields from form
- Clean key-value display

### Panel Features

**Header**:
- Facebook icon (recognizable blue)
- Lead count with proper pluralization
- Gradient background (blue tint)

**List**:
- Scrollable (max 600px height)
- Hover effects on cards
- Responsive spacing

**Empty State**:
- Document icon
- Friendly message
- Explains what will appear

**Summary Footer**:
- Status breakdown (Booked, New, Qualified)
- Color-coded dots
- Total count

---

## 💡 Use Cases

### For Call Agents

1. **Monitor New Leads**
   - See Facebook form submissions in real-time
   - Identify high-priority leads from specific ads
   - Quick access to contact information

2. **Track Lead Status**
   - View current status of each lead
   - Filter mentally by status badges
   - See progression from New → Contacted → Qualified → Booked

3. **Contact Leads**
   - Copy email/phone directly from panel
   - Know which ad/form they came from
   - Reference custom fields for context

### For Managers

1. **Lead Source Tracking**
   - See which Facebook ads are generating leads
   - Identify best-performing forms
   - Monitor lead quality by source

2. **Conversion Monitoring**
   - Quick view of booked vs. new leads
   - Track team's lead follow-up progress
   - Identify bottlenecks in lead process

3. **Performance Analytics**
   - Daily lead volume from Facebook
   - Lead quality indicators
   - Response time insights

---

## 🔄 Data Refresh

- **Auto-Refresh**: Every 30 seconds (same as dashboard)
- **Manual Refresh**: Via dashboard header refresh button
- **Error Handling**: Gracefully returns empty array on API errors

---

## 🛡️ Error Handling

The Facebook leads client includes comprehensive error handling:

1. **No Workflows Found**: Returns empty array, logs message
2. **No Facebook Workflow**: Returns empty array, logs message
3. **API Errors**: Catches and logs, returns empty array
4. **Invalid Data**: Skips invalid leads, continues processing
5. **Missing Required Fields**: Validates before adding to list

This ensures the dashboard always loads, even if Facebook leads aren't configured.

---

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Panel width: Full width in main content area
- Cards: Flexible layout with details visible
- Summary: Horizontal stats bar

### Mobile (<1024px)
- Panel: Full width, stacked layout
- Cards: Condensed details, still readable
- Summary: Wraps naturally

---

## 🎯 Future Enhancements (Optional)

### Phase 2 Features

1. **Lead Filtering**
   - Filter by status
   - Filter by source (ad vs. page)
   - Filter by date range

2. **Lead Actions**
   - Mark as contacted
   - Update status directly from panel
   - Add notes to leads

3. **Advanced Display**
   - Group by ad/form
   - Show ad performance metrics
   - Display lead score if available

4. **Integration**
   - Sync with CRM
   - Auto-assign to agents
   - Send notifications for new leads

---

## ✅ Completion Status

**All systems working**:
- ✅ Facebook leads client created
- ✅ Data types defined
- ✅ Panel component built
- ✅ Integrated into dashboard
- ✅ Error handling implemented
- ✅ Responsive design complete
- ✅ Dashboard compiles successfully

**Dashboard Access**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 📝 Configuration

### Environment Variables

The Facebook leads client uses existing n8n configuration:

```env
N8N_API_URL=https://your-n8n-instance.com/api/v1
N8N_API_KEY=your-api-key
```

Optional (currently unused):
```env
FACEBOOK_LEADS_PATH=/path/to/leads
```

### n8n Workflow Setup

1. **Create Facebook Leads Workflow**
   - Name must include "facebook" or "fb lead"
   - Use Facebook Leadgen Webhook trigger
   - Process and store lead data
   - Ensure workflow runs successfully

2. **Data Structure**
   - Include standard fields: id, name, email, phone
   - Optional: form_id, form_name, ad_id, ad_name
   - Custom fields stored in `field_data` or `customFields`

---

## 🎊 Summary

### What Was Added
✅ Facebook lead form submission tracking
✅ Real-time lead display in dashboard
✅ Status and source tracking
✅ Contact information display
✅ Custom fields support
✅ Error handling and empty states

### Impact
- **More Complete**: Dashboard now shows all lead sources (calls + Facebook)
- **Better Visibility**: Agents see all leads in one place
- **Faster Response**: Real-time updates enable quick follow-up
- **Source Tracking**: Know which ads/forms drive leads

---

**Feature is production-ready!** 🚀

---

*Last Updated: January 19, 2026*
*Version: 2.2*
*Status: ✅ Complete & Production Ready*
