import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, firstName, lastName, contactId } = body;

    // Validate required field
    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Phone number is required',
            field: 'phone',
          },
          message: 'Validation failed',
        },
        { status: 400 }
      );
    }

    // Call n8n webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE}${process.env.NEXT_PUBLIC_PHONE_VALIDATION_PATH}`;

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        contactId: contactId || null,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.statusText}`);
    }

    const n8nData = await n8nResponse.json();

    // Return standardized response
    return NextResponse.json({
      success: true,
      data: {
        phone,
        status: n8nData.status || 'processing',
        message: n8nData.message || 'Phone validation workflow triggered',
        raw: n8nData,
      },
      error: null,
      message: 'Phone validation initiated successfully',
    });
  } catch (error) {
    console.error('Phone validation error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        message: 'Failed to process phone validation',
      },
      { status: 500 }
    );
  }
}
