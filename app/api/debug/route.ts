import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env: {
      N8N_API_URL: process.env.N8N_API_URL ? 'SET' : 'NOT SET',
      N8N_API_KEY: process.env.N8N_API_KEY ? 'SET (length: ' + process.env.N8N_API_KEY.length + ')' : 'NOT SET',
      GHL_API_KEY: process.env.GHL_API_KEY ? 'SET' : 'NOT SET',
      VAPI_API_KEY: process.env.VAPI_API_KEY ? 'SET' : 'NOT SET',
    },
    timestamp: new Date().toISOString(),
  });
}
