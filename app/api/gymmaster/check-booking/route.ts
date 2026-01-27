import { NextRequest, NextResponse } from 'next/server';
import { gymMasterClient, MemberBookingStatus } from '@/lib/gymmaster-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gymmaster/check-booking
 * Check GymMaster booking status for a phone number
 *
 * Request body:
 * {
 *   phone: string;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   data?: MemberBookingStatus;
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!gymMasterClient.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'GymMaster API is not configured' },
        { status: 503 }
      );
    }

    console.log(`[GymMaster API] Checking booking status for phone: ${phone}`);

    const status = await gymMasterClient.checkLeadBookingStatus(phone);

    console.log(`[GymMaster API] Result:`, {
      phone,
      isMember: status.isMember,
      hasBooking: status.hasBooking,
      bookingsCount: status.upcomingBookings.length,
    });

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('[GymMaster API] Error checking booking status:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check booking status',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gymmaster/check-booking
 * Health check for GymMaster integration
 */
export async function GET() {
  const isConfigured = gymMasterClient.isConfigured();

  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    message: isConfigured
      ? 'GymMaster API is configured and ready'
      : 'GymMaster API credentials are missing',
  });
}
