/**
 * GymMaster API Client
 * Fetches booking data directly from GymMaster to verify actual bookings
 *
 * API Documentation: https://www.gymmaster.com/gymmaster-reporting-api/
 * Member Portal API: /portal/api/v1/ and /portal/api/v2/
 */

// GymMaster credentials
const GYMMASTER_BASE_URL = process.env.GYMMASTER_BASE_URL || '';
const GYMMASTER_API_KEY_MEMBER = process.env.GYMMASTER_API_KEY_MEMBER || '';
const GYMMASTER_API_KEY_STAFF = process.env.GYMMASTER_API_KEY_STAFF || '';

// Cache for member data (5 minute TTL)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memberCache: Map<string, CacheEntry<GymMasterMember[]>> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize phone number for comparison
 * Converts various formats to a consistent format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Handle Australian numbers
  // +61 or 61 prefix -> convert to 0
  if (digits.startsWith('61') && digits.length >= 11) {
    digits = '0' + digits.slice(2);
  }

  // Ensure leading 0 for Australian mobile/landline
  if (digits.length === 9 && !digits.startsWith('0')) {
    digits = '0' + digits;
  }

  return digits;
}

export interface GymMasterBooking {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  bookingDate: string;
  bookingTime?: string;
  serviceName?: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  createdAt: string;
}

export interface GymMasterBookingSummary {
  totalBookings: number;
  checkedInBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  services: { name: string; count: number }[];
}

export interface GymMasterMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipStatus: string;
  joinDate?: string;
}

export interface MemberUpcomingBooking {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  location?: string;
  staffName?: string;
}

export interface MemberBookingStatus {
  isMember: boolean;
  memberId?: string;
  memberName?: string;
  hasBooking: boolean;
  upcomingBookings: MemberUpcomingBooking[];
  checkedAt: string;
}

export class GymMasterClient {
  private baseUrl: string;
  private apiKeyMember: string;
  private apiKeyStaff: string;

  constructor() {
    this.baseUrl = GYMMASTER_BASE_URL;
    this.apiKeyMember = GYMMASTER_API_KEY_MEMBER;
    this.apiKeyStaff = GYMMASTER_API_KEY_STAFF;
  }

  /**
   * Check if GymMaster is configured
   */
  isConfigured(): boolean {
    return Boolean(this.baseUrl && (this.apiKeyMember || this.apiKeyStaff));
  }

  /**
   * Make authenticated request to GymMaster API
   */
  private async fetch(endpoint: string, options: RequestInit = {}, useStaffKey = true): Promise<any> {
    if (!this.isConfigured()) {
      console.warn('GymMaster API not configured');
      return null;
    }

    const apiKey = useStaffKey ? this.apiKeyStaff : this.apiKeyMember;
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-GM-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        next: { revalidate: 0 }, // Disable caching for fresh data
      });

      if (!response.ok) {
        throw new Error(`GymMaster API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('GymMaster API request failed:', error);
      throw error;
    }
  }

  /**
   * Get available KPI categories
   */
  async getKpiCategories(): Promise<string[]> {
    const data = await this.fetch('/api/v2/report/kpi/categories/list');
    return data || [];
  }

  /**
   * Get available report list
   */
  async getReportList(): Promise<any[]> {
    const data = await this.fetch('/api/v2/report/standard_report/list');
    return data || [];
  }

  /**
   * Get bookings for a date range
   * Uses the standard report endpoint with booking report
   */
  async getBookings(startDate: string, endDate: string): Promise<GymMasterBooking[]> {
    try {
      // First try to get the booking report
      const response = await this.fetch('/api/v2/report/standard_report', {
        method: 'POST',
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          report_id: 9, // "All Bookings" report
          displaymode: 'CURRENT',
          required_columns: [
            'Member ID',
            'Member Name',
            'Email',
            'Phone',
            'Booking Date',
            'Booking Time',
            'Service',
            'Status',
            'Created'
          ],
        }),
      });

      if (!response?.data) {
        return [];
      }

      // Map the response to our booking interface
      return response.data.map((row: any) => ({
        id: row['Booking ID'] || row.id || `booking-${Date.now()}`,
        memberId: row['Member ID'] || '',
        memberName: row['Member Name'] || 'Unknown',
        memberEmail: row['Email'] || row.email,
        memberPhone: row['Phone'] || row.phone,
        bookingDate: row['Booking Date'] || row.booking_date,
        bookingTime: row['Booking Time'] || row.booking_time,
        serviceName: row['Service'] || row.service,
        status: this.mapBookingStatus(row['Status'] || row.status),
        createdAt: row['Created'] || row.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching GymMaster bookings:', error);
      return [];
    }
  }

  /**
   * Get today's bookings (tries standard report first, falls back to empty)
   */
  async getTodaysBookings(): Promise<GymMasterBooking[]> {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = startDate;
    return this.getBookings(startDate, endDate);
  }

  /**
   * Get today's booking summary using KPI endpoint (more reliable)
   * Returns counts of total, checked-in, cancelled, and no-show bookings
   */
  async getTodaysBookingSummary(): Promise<GymMasterBookingSummary> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const response = await this.fetch('/api/v2/report/kpi/categories', {
        method: 'POST',
        body: JSON.stringify({
          date: { start: today, end: today },
          selected_categories: ['booking_summary'],
          grouped_categories: true,
          company_id: null,
        }),
      });

      if (!response?.result?.booking_summary) {
        return {
          totalBookings: 0,
          checkedInBookings: 0,
          cancelledBookings: 0,
          noShowBookings: 0,
          services: [],
        };
      }

      const bookingSummary = response.result.booking_summary;
      let totalBookings = 0;
      let checkedInBookings = 0;
      let cancelledBookings = 0;
      let noShowBookings = 0;
      const services: { name: string; count: number }[] = [];

      bookingSummary.forEach((item: any) => {
        const booking = item.bookings;
        if (!booking) return;

        const name = (booking.name || '').toLowerCase();
        const value = booking.value || 0;

        if (name.includes('total bookings')) {
          totalBookings = value;
        } else if (name.includes('checked in')) {
          checkedInBookings = value;
        } else if (name.includes('cancelled')) {
          cancelledBookings = value;
        } else if (name.includes('no show')) {
          noShowBookings = value;
        } else if (name.includes('service:')) {
          // Extract service name
          const serviceName = booking.name.replace(/^service:\s*/i, '').trim();
          services.push({ name: serviceName, count: value });
        }
      });

      return {
        totalBookings,
        checkedInBookings,
        cancelledBookings,
        noShowBookings,
        services,
      };
    } catch (error) {
      console.error('Error fetching GymMaster booking summary:', error);
      return {
        totalBookings: 0,
        checkedInBookings: 0,
        cancelledBookings: 0,
        noShowBookings: 0,
        services: [],
      };
    }
  }

  /**
   * Get confirmed bookings count for today using KPI data
   * Confirmed = Checked in bookings (actually attended)
   */
  async getTodaysConfirmedBookingsCount(): Promise<number> {
    const summary = await this.getTodaysBookingSummary();
    // Use checked-in as confirmed (they actually showed up)
    return summary.checkedInBookings;
  }

  /**
   * Check if a specific phone number has a booking
   */
  async checkBookingByPhone(phone: string, startDate?: string, endDate?: string): Promise<GymMasterBooking | null> {
    const today = new Date();
    const start = startDate || today.toISOString().split('T')[0];
    const end = endDate || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ahead

    const bookings = await this.getBookings(start, end);

    // Normalize phone for comparison
    const normalizedPhone = phone.replace(/\D/g, '');

    return bookings.find(b => {
      const bookingPhone = (b.memberPhone || '').replace(/\D/g, '');
      return bookingPhone.includes(normalizedPhone) || normalizedPhone.includes(bookingPhone);
    }) || null;
  }

  /**
   * Get KPI data for bookings
   */
  async getBookingKpis(startDate: string, endDate: string): Promise<any> {
    try {
      const response = await this.fetch('/api/v2/report/kpi/categories', {
        method: 'POST',
        body: JSON.stringify({
          date: { start: startDate, end: endDate },
          selected_categories: ['booking', 'class_summary'],
          grouped_categories: true,
          company_id: null,
        }),
      });

      return response || {};
    } catch (error) {
      console.error('Error fetching GymMaster KPIs:', error);
      return {};
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(endpoint: string): Promise<any> {
    try {
      const response = await this.fetch(`/api/v2/dashboard?endpoint=${encodeURIComponent(endpoint)}`);
      return response || {};
    } catch (error) {
      console.error('Error fetching GymMaster dashboard:', error);
      return {};
    }
  }

  /**
   * Map GymMaster booking status to our standard status
   */
  private mapBookingStatus(status: string): GymMasterBooking['status'] {
    const statusLower = (status || '').toLowerCase();

    if (statusLower.includes('confirm') || statusLower.includes('booked')) {
      return 'confirmed';
    }
    if (statusLower.includes('cancel')) {
      return 'cancelled';
    }
    if (statusLower.includes('complete') || statusLower.includes('attended')) {
      return 'completed';
    }
    if (statusLower.includes('pending') || statusLower.includes('wait')) {
      return 'pending';
    }

    return 'pending';
  }

  /**
   * Search for a member by phone or email (legacy method - use searchMemberByPhone instead)
   */
  async searchMember(searchTerm: string): Promise<GymMasterMember | null> {
    // Delegate to phone search
    return this.searchMemberByPhone(searchTerm);
  }

  /**
   * Fetch all current members from GymMaster
   * Uses the Staff API key and caches results for 5 minutes
   */
  async fetchAllMembers(forceRefresh = false): Promise<GymMasterMember[]> {
    const cacheKey = 'all_members';

    // Check cache first
    if (!forceRefresh) {
      const cached = memberCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    try {
      // Use the Member Portal API v1 endpoint
      const response = await this.fetch(
        `/portal/api/v1/members?api_key=${this.apiKeyStaff}`,
        { method: 'GET' },
        true // Use staff key
      );

      if (!response?.result || !Array.isArray(response.result)) {
        console.warn('GymMaster members response invalid:', response);
        return [];
      }

      // Map API response to our interface
      const members: GymMasterMember[] = response.result.map((m: any) => ({
        id: String(m.id || m.memberid || ''),
        firstName: m.firstname || m.firstName || '',
        lastName: m.surname || m.lastName || '',
        email: m.email || undefined,
        phone: m.phonecell || m.phone || m.phonehome || undefined,
        membershipStatus: m.membership_status || m.status || 'unknown',
        joinDate: m.joindate || m.join_date || undefined,
      }));

      // Cache the results
      memberCache.set(cacheKey, {
        data: members,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      console.log(`GymMaster: Fetched and cached ${members.length} members`);
      return members;
    } catch (error) {
      console.error('Error fetching GymMaster members:', error);
      return [];
    }
  }

  /**
   * Search for a member by phone number
   * Normalizes both search phone and member phones for comparison
   */
  async searchMemberByPhone(phone: string): Promise<GymMasterMember | null> {
    if (!phone) return null;

    const normalizedSearch = normalizePhone(phone);
    if (normalizedSearch.length < 8) {
      console.warn('Phone number too short for search:', phone);
      return null;
    }

    const members = await this.fetchAllMembers();

    // Search for matching phone
    for (const member of members) {
      if (member.phone) {
        const normalizedMember = normalizePhone(member.phone);
        // Check if either contains the other (partial match)
        if (
          normalizedMember === normalizedSearch ||
          normalizedMember.endsWith(normalizedSearch) ||
          normalizedSearch.endsWith(normalizedMember)
        ) {
          return member;
        }
      }
    }

    return null;
  }

  /**
   * Login as a member to get an access token
   * Required for accessing member-specific endpoints like bookings
   */
  async loginAsMember(memberId: string): Promise<{ token: string; expires: number } | null> {
    try {
      // Login using member ID (requires staff API key)
      const response = await this.fetch(
        `/portal/api/v1/login?api_key=${this.apiKeyStaff}`,
        {
          method: 'POST',
          body: JSON.stringify({ memberid: parseInt(memberId, 10) }),
        },
        true
      );

      if (!response?.result?.token) {
        console.warn('GymMaster login failed for member:', memberId);
        return null;
      }

      return {
        token: response.result.token,
        expires: response.result.expires || 3600,
      };
    } catch (error) {
      console.error('Error logging in as member:', error);
      return null;
    }
  }

  /**
   * Get a member's upcoming bookings
   * Requires a valid member token (from loginAsMember)
   */
  async getMemberUpcomingBookings(token: string): Promise<MemberUpcomingBooking[]> {
    try {
      const response = await this.fetch(
        `/portal/api/v2/member/bookings?api_key=${this.apiKeyMember}&token=${token}`,
        { method: 'GET' },
        false // Use member key
      );

      if (!response) {
        return [];
      }

      const bookings: MemberUpcomingBooking[] = [];

      // Handle class bookings
      if (response.classbookings && Array.isArray(response.classbookings)) {
        for (const booking of response.classbookings) {
          bookings.push({
            id: String(booking.id || ''),
            day: booking.day || booking.arrival || '',
            startTime: booking.starttime || booking.start_str || '',
            endTime: booking.endtime || booking.end_str || '',
            serviceName: booking.name || booking.classname || 'Class',
            location: booking.location,
            staffName: booking.staffname,
          });
        }
      }

      // Handle service bookings
      if (response.servicebookings && Array.isArray(response.servicebookings)) {
        for (const booking of response.servicebookings) {
          bookings.push({
            id: String(booking.id || ''),
            day: booking.day || '',
            startTime: booking.starttime || booking.start_str || '',
            endTime: booking.endtime || booking.end_str || '',
            serviceName: booking.servicename || booking.name || 'Service',
            location: booking.location,
            staffName: booking.staffname,
          });
        }
      }

      return bookings;
    } catch (error) {
      console.error('Error fetching member bookings:', error);
      return [];
    }
  }

  /**
   * Check booking status for a lead by phone number
   * This is the main method used by the dashboard to verify if a lead has booked
   */
  async checkLeadBookingStatus(phone: string): Promise<MemberBookingStatus> {
    const checkedAt = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        isMember: false,
        hasBooking: false,
        upcomingBookings: [],
        checkedAt,
      };
    }

    try {
      // Step 1: Search for member by phone
      const member = await this.searchMemberByPhone(phone);

      if (!member) {
        return {
          isMember: false,
          hasBooking: false,
          upcomingBookings: [],
          checkedAt,
        };
      }

      // Step 2: Login as member to get token
      const loginResult = await this.loginAsMember(member.id);

      if (!loginResult) {
        // Member exists but couldn't login - still report as member
        return {
          isMember: true,
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`.trim(),
          hasBooking: false,
          upcomingBookings: [],
          checkedAt,
        };
      }

      // Step 3: Get upcoming bookings
      const bookings = await this.getMemberUpcomingBookings(loginResult.token);

      return {
        isMember: true,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`.trim(),
        hasBooking: bookings.length > 0,
        upcomingBookings: bookings,
        checkedAt,
      };
    } catch (error) {
      console.error('Error checking lead booking status:', error);
      return {
        isMember: false,
        hasBooking: false,
        upcomingBookings: [],
        checkedAt,
      };
    }
  }

  /**
   * Batch check booking status for multiple phone numbers
   * More efficient than calling checkLeadBookingStatus for each
   */
  async batchCheckBookingStatus(phones: string[]): Promise<Map<string, MemberBookingStatus>> {
    const results = new Map<string, MemberBookingStatus>();

    // Pre-fetch all members once
    await this.fetchAllMembers();

    // Check each phone in parallel (with concurrency limit)
    const CONCURRENCY = 5;
    const chunks = [];
    for (let i = 0; i < phones.length; i += CONCURRENCY) {
      chunks.push(phones.slice(i, i + CONCURRENCY));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (phone) => {
        const status = await this.checkLeadBookingStatus(phone);
        results.set(normalizePhone(phone), status);
      });
      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Clear the member cache (useful for forcing fresh data)
   */
  clearCache(): void {
    memberCache.clear();
    console.log('GymMaster member cache cleared');
  }
}

export const gymMasterClient = new GymMasterClient();
