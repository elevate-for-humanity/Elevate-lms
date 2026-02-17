import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Returns client information for audit trail purposes.
 * Used by compliance enforcement to capture IP address.
 */
export async function GET(request: NextRequest) {
  const headersList = await headers();
  
  // Get IP from various headers (in order of preference)
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    request.ip ||
    '0.0.0.0';

  return NextResponse.json({
    ip,
    timestamp: new Date().toISOString(),
  });
}
