# Active Wellness Admin - n8n Integration App

A Next.js web application that integrates with your n8n workflows for phone validation, lead scoring, and management.

## Features

- **Phone Validation**: Validate phone numbers using your n8n workflow
- **Lead Scoring**: Automatic lead scoring based on phone validation results
- **Real-time Processing**: Direct integration with n8n webhooks
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Type-Safe**: Full TypeScript support

## Prerequisites

- Node.js 18+ and npm
- n8n instance with configured workflows (already set up at `https://awsperth.app.n8n.cloud`)

## Installation

1. **Navigate to the project directory**:
   ```bash
   cd n8n-admin-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables are already configured** in `.env.local`:
   - `NEXT_PUBLIC_N8N_WEBHOOK_BASE` - Your n8n webhook base URL
   - `NEXT_PUBLIC_PHONE_VALIDATION_PATH` - Phone validation webhook path

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
n8n-admin-app/
├── app/
│   ├── api/
│   │   └── validate-phone/     # API route for phone validation
│   │       └── route.ts
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   └── PhoneValidationForm.tsx # Phone validation form component
├── types/
│   └── index.ts                # TypeScript type definitions
├── .env.local                  # Environment variables (not in git)
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Usage

### Phone Validation

1. Enter a phone number (required) - supports Australian format (e.g., "0412345678" or "+61412345678")
2. Optionally add:
   - First Name
   - Last Name
   - Email Address
3. Click "Validate Phone"
4. The app will:
   - Call your n8n workflow
   - Process the phone validation
   - Display the results

### Understanding the Results

The workflow (as currently configured) returns an immediate acknowledgment:
```json
{
  "status": "received",
  "message": "Phone validation workflow triggered",
  "phone": "+61412345678"
}
```

The actual validation happens asynchronously in n8n, which:
- Validates the phone via Twilio
- Calculates lead score
- Updates GoHighLevel CRM
- Triggers outbound calls (during business hours)

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts** to link your project

### Option 2: Deploy via GitHub

1. **Create a GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/n8n-admin-app.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Add Environment Variables** in Vercel dashboard:
   - `NEXT_PUBLIC_N8N_WEBHOOK_BASE`
   - `NEXT_PUBLIC_PHONE_VALIDATION_PATH`

4. **Deploy** - Vercel will automatically deploy your app

## API Routes

### POST /api/validate-phone

Validates a phone number via n8n workflow.

**Request Body**:
```json
{
  "phone": "+61412345678",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "phone": "+61412345678",
    "status": "received",
    "message": "Phone validation workflow triggered"
  },
  "error": null,
  "message": "Phone validation initiated successfully"
}
```

**Response (Error)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number is required",
    "field": "phone"
  },
  "message": "Validation failed"
}
```

## n8n Workflow Integration

### Current Workflows

1. **Phone Validation & Lead Scoring** (`/validate-phone-and-call`)
   - Validates phone via Twilio
   - Calculates lead score
   - Triggers outbound calls
   - Updates CRM

2. **Facebook Lead Capture** (`/facebook-leads`) - Not yet integrated
3. **VAPI Tool Handler** (`/vapi-tools`) - Not yet integrated
4. **VAPI Status Handler** (`/vapi-status`) - Not yet integrated

### Future Enhancements

To get detailed validation results (instead of just acknowledgment), the n8n workflow needs modification:

1. Remove immediate "Respond to Webhook" node
2. Add response node after validation completes
3. Return detailed results:
   ```json
   {
     "success": true,
     "data": {
       "phone": "+61412345678",
       "isValid": true,
       "isCallable": true,
       "carrierType": "mobile",
       "leadScore": 90,
       "action": "call_scheduled"
     }
   }
   ```

See `../WORKFLOWS.md` for detailed modification instructions.

## Customization

### Adding More Workflows

1. **Create new API route**:
   ```typescript
   // app/api/capture-lead/route.ts
   export async function POST(request: NextRequest) {
     // Similar to validate-phone
   }
   ```

2. **Create UI component** for the workflow

3. **Add to main page** or create new page

### Styling

- Modify `tailwind.config.ts` for theme customization
- Update `app/globals.css` for global styles
- Component styles use Tailwind utility classes

## Troubleshooting

### CORS Errors

If you encounter CORS errors when calling n8n webhooks:
- Check that webhooks are configured to accept requests from your domain
- Consider using the API route as a proxy (already implemented)

### Webhook Not Responding

1. Verify n8n workflow is active
2. Check webhook URL in `.env.local`
3. Test webhook directly with curl:
   ```bash
   curl -X POST https://awsperth.app.n8n.cloud/webhook/validate-phone-and-call \
     -H "Content-Type: application/json" \
     -d '{"phone": "+61412345678"}'
   ```

### Build Errors

If you encounter TypeScript errors:
```bash
npm run build
```

This will show detailed error messages.

## Related Documentation

- [WORKFLOWS.md](../WORKFLOWS.md) - Complete API documentation for all n8n workflows
- [WORKFLOW_ANALYSIS.md](../WORKFLOW_ANALYSIS.md) - Detailed workflow analysis
- [RECOMMENDATIONS.md](../RECOMMENDATIONS.md) - Implementation recommendations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)
- **Backend**: n8n workflows (serverless)

## License

Private - Active Wellness

## Support

For issues or questions about:
- **n8n workflows**: See workflow documentation
- **Frontend app**: Check this README or create an issue
- **Deployment**: See Vercel documentation

---

Built with ❤️ using Next.js and n8n
