/**
 * GymMaster API Client
 * Fetches booking data directly from GymMaster to verify actual bookings
 *
 * API Documentation: https://www.gymmaster.com/gymmaster-reporting-api/
 */

// GymMaster credentials
const GYMMASTER_BASE_URL = process.env.GYMMASTER_BASE_URL || '';
const GYMMASTER_API_KEY_MEMBER = process.env.GYMMASTER_API_KEY_MEMBER || '';
const GYMMASTER_API_KEY_STAFF = process.env.GYMMASTER_API_KEY_STAFF || '';

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
   * Search for a member by phone or email
   */
  async searchMember(searchTerm: string): Promise<GymMasterMember | null> {
    // This would require a member search endpoint
    // For now, return null - can be implemented when API endpoint is confirmed
    console.log('Member search not yet implemented for:', searchTerm);
    return null;
  }
}

export const gymMasterClient = new GymMasterClient();
