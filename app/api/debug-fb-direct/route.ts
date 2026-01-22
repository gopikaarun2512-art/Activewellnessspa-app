import { NextResponse } from 'next/server';
import { facebookAPIClient } from '@/lib/facebook-api-client';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test direct Facebook Graph API
 * Access at: /api/debug-fb-direct
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    configured: facebookAPIClient.isConfigured(),
    pageId: process.env.FACEBOOK_PAGE_ID ? 'set' : 'not set',
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN ? 'set (length: ' + process.env.FACEBOOK_ACCESS_TOKEN.length + ')' : 'not set',
  };

  if (!facebookAPIClient.isConfigured()) {
    return NextResponse.json({
      ...results,
      error: 'Facebook API not configured. Set FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID environment variables.',
    }, { status: 400 });
  }

  // Test what type of object the Page ID is
  try {
    const pageInfoUrl = `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}?fields=id,name,category,fan_count,about&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`;
    const pageResponse = await fetch(pageInfoUrl);
    const pageData = await pageResponse.json();
    results.pageInfo = pageData;
  } catch (error: any) {
    results.pageInfo = { error: error.message };
  }

  // Also try to get accounts (pages) that this token has access to
  try {
    const accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`;
    const accountsResponse = await fetch(accountsUrl);
    const accountsData = await accountsResponse.json();
    results.availablePages = accountsData;
  } catch (error: any) {
    results.availablePages = { error: error.message };
  }

  // Get AWST date range
  const now = new Date();
  const awstFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Perth',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const awstDateStr = awstFormatter.format(now);
  const [year, month, day] = awstDateStr.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0, 0));

  results.dateRange = {
    awstDate: awstDateStr,
    startOfDayUTC: startOfDay.toISOString(),
    endOfDayUTC: now.toISOString(),
  };

  // Test getting leadgen forms
  try {
    const forms = await facebookAPIClient.getLeadgenForms();
    results.forms = {
      success: true,
      count: forms.length,
      data: forms.map(f => ({
        id: f.id,
        name: f.name,
        leadsCount: f.leads_count,
        status: f.status,
      })),
    };
  } catch (error: any) {
    results.forms = {
      success: false,
      error: error.message,
    };
  }

  // Test getting leads for today
  try {
    const leads = await facebookAPIClient.getLeads(startOfDay, now);
    results.leads = {
      success: true,
      count: leads.length,
      sample: leads.slice(0, 5).map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone ? '***' + l.phone.slice(-4) : undefined,
        email: l.email ? '***@' + l.email.split('@')[1] : undefined,
        createdTime: l.createdTime,
        formName: l.formName,
        status: l.status,
      })),
    };
  } catch (error: any) {
    results.leads = {
      success: false,
      error: error.message,
    };
  }

  return NextResponse.json(results, { status: 200 });
}
