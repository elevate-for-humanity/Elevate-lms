import { NextResponse } from 'next/server';
import { readBarberVideoStudioStatus } from '@/lib/barber/video-studio-status';

// PUBLIC ROUTE: local dev preview of barber video generation progress (no PII)
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  return NextResponse.json(readBarberVideoStudioStatus());
}
