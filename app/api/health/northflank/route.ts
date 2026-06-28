import { NextResponse } from 'next/server';

/**
 * Northflank Health Check Endpoint
 * 
 * Confirms the application is alive and can serve requests.
 * Used by Northflank to determine container readiness.
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'elevate-lms',
      environment: process.env.NODE_ENV
    }, 
    { status: 200 }
  );
}
