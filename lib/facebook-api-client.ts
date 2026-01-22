import { FacebookLead } from '@/types/analytics';

// Facebook Graph API configuration
const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '';
const FB_API_VERSION = 'v18.0';
const FB_GRAPH_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

interface FacebookLeadgenForm {
  id: string;
  name: string;
  leads_count: number;
  status: string;
}

interface FacebookLeadData {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
  form_name?: string;
}

interface FacebookLeadsResponse {
  data: FacebookLeadData[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Client for fetching leads directly from Facebook Graph API
 * This bypasses n8n and gets real-time lead data from Facebook
 */
export class FacebookAPIClient {
  private accessToken: string;
  private pageId: string;
  private pageAccessToken: string | null = null;

  constructor() {
    this.accessToken = FB_ACCESS_TOKEN;
    this.pageId = FB_PAGE_ID;
  }

  /**
   * Get the page-specific access token (required for leadgen forms)
   * The user token can fetch /me/accounts which returns page tokens
   */
  private async getPageAccessToken(): Promise<string> {
    if (this.pageAccessToken) {
      return this.pageAccessToken;
    }

    try {
      const url = `${FB_GRAPH_API_BASE}/me/accounts?access_token=${this.accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        // Find the page matching our Page ID
        const page = data.data.find((p: any) => p.id === this.pageId);
        if (page && page.access_token) {
          this.pageAccessToken = page.access_token;
          console.log('[FB API] Got page-specific access token');
          return this.pageAccessToken as string;
        }
      }

      // Fallback to main token if page token not found
      console.log('[FB API] Page token not found, using main token');
      return this.accessToken;
    } catch (error) {
      console.error('[FB API] Error getting page token:', error);
      return this.accessToken;
    }
  }

  /**
   * Check if Facebook API is configured
   */
  isConfigured(): boolean {
    return Boolean(this.accessToken && this.pageId);
  }

  /**
   * Make a request to Facebook Graph API
   */
  private async fetchFacebookAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${FB_GRAPH_API_BASE}${endpoint}`);
    url.searchParams.set('access_token', this.accessToken);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    console.log('[FB API] Fetching:', url.pathname);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[FB API] Error:', errorData);
      throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all leadgen forms for the page
   * Uses page-specific access token for proper permissions
   */
  async getLeadgenForms(): Promise<FacebookLeadgenForm[]> {
    if (!this.isConfigured()) {
      console.log('[FB API] Not configured - missing access token or page ID');
      return [];
    }

    try {
      // Get the page-specific token (required for leadgen forms)
      const pageToken = await this.getPageAccessToken();

      const url = `${FB_GRAPH_API_BASE}/${this.pageId}/leadgen_forms?fields=id,name,leads_count,status&access_token=${pageToken}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log(`[FB API] Found ${data.data?.length || 0} leadgen forms`);
      return data.data || [];
    } catch (error) {
      console.error('[FB API] Error fetching leadgen forms:', error);
      return [];
    }
  }

  /**
   * Get leads from a specific form
   * Uses page-specific access token for proper permissions
   */
  async getLeadsFromForm(formId: string, limit: number = 100): Promise<FacebookLeadData[]> {
    try {
      // Get the page-specific token
      const pageToken = await this.getPageAccessToken();

      const url = `${FB_GRAPH_API_BASE}/${formId}/leads?fields=id,created_time,field_data,ad_id,ad_name&limit=${limit}&access_token=${pageToken}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`[FB API] Error fetching leads from form ${formId}:`, error);
      return [];
    }
  }

  /**
   * Get all leads from all forms for a date range
   */
  async getLeads(startDate: Date, endDate: Date): Promise<FacebookLead[]> {
    if (!this.isConfigured()) {
      console.log('[FB API] Not configured - skipping direct Facebook fetch');
      return [];
    }

    console.log('[FB API] Fetching leads for date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateAWST: startDate.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
      endDateAWST: endDate.toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
    });

    try {
      // Get all leadgen forms
      const forms = await this.getLeadgenForms();

      if (forms.length === 0) {
        console.log('[FB API] No leadgen forms found');
        return [];
      }

      // Fetch leads from all forms in parallel
      const leadsPromises = forms.map(form =>
        this.getLeadsFromForm(form.id).then(leads =>
          leads.map(lead => ({ ...lead, form_id: form.id, form_name: form.name }))
        )
      );

      const allLeadsArrays = await Promise.all(leadsPromises);
      const allLeads = allLeadsArrays.flat();

      console.log(`[FB API] Fetched ${allLeads.length} total leads from ${forms.length} forms`);

      // Convert to FacebookLead format and filter by date
      const facebookLeads: FacebookLead[] = allLeads
        .map(lead => this.convertToFacebookLead(lead))
        .filter(lead => {
          const leadDate = new Date(lead.createdTime);
          return leadDate >= startDate && leadDate <= endDate;
        });

      console.log(`[FB API] Filtered to ${facebookLeads.length} leads in date range`);

      // Sort by created time (most recent first)
      return facebookLeads.sort((a, b) =>
        new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      );
    } catch (error) {
      console.error('[FB API] Error fetching leads:', error);
      return [];
    }
  }

  /**
   * Convert Facebook API lead data to our FacebookLead format
   */
  private convertToFacebookLead(lead: FacebookLeadData & { form_id?: string; form_name?: string }): FacebookLead {
    // Extract field data into a map
    const fieldMap: Record<string, string> = {};
    lead.field_data?.forEach(field => {
      fieldMap[field.name.toLowerCase()] = field.values?.[0] || '';
    });

    // Extract common fields (Facebook form field names vary)
    const firstName = fieldMap['first_name'] || fieldMap['firstname'] || fieldMap['first name'] || '';
    const lastName = fieldMap['last_name'] || fieldMap['lastname'] || fieldMap['last name'] || '';
    const fullName = fieldMap['full_name'] || fieldMap['fullname'] || fieldMap['name'] ||
                     `${firstName} ${lastName}`.trim() || 'Unknown';
    const email = fieldMap['email'] || fieldMap['e-mail'] || '';
    const phone = fieldMap['phone_number'] || fieldMap['phone'] || fieldMap['mobile'] ||
                  fieldMap['cell_phone'] || fieldMap['contact_number'] || '';

    return {
      id: lead.id,
      formId: lead.form_id || 'unknown',
      formName: lead.form_name,
      createdTime: lead.created_time,
      name: fullName,
      email: email || undefined,
      phone: phone || undefined,
      adId: lead.ad_id,
      adName: lead.ad_name,
      status: 'new', // Direct FB leads are always "new" - journey enrichment happens separately
      source: 'facebook_ad',
      customFields: fieldMap,
    };
  }

  /**
   * Get leads from today (AWST midnight to now)
   */
  async getTodaysLeads(): Promise<FacebookLead[]> {
    // Get current date in AWST
    const now = new Date();
    const awstFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Perth',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const awstDateStr = awstFormatter.format(now);
    const [year, month, day] = awstDateStr.split('-').map(Number);

    // AWST midnight in UTC
    const todayMidnightAWSTinUTC = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0, 0));

    return this.getLeads(todayMidnightAWSTinUTC, now);
  }
}

export const facebookAPIClient = new FacebookAPIClient();
