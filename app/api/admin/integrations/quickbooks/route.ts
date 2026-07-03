import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  
  return Response.json({ 
    status: 'not_configured',
    message: 'QuickBooks integration not yet configured'
  });
}

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  
  return Response.json({ 
    status: 'not_configured', 
    message: 'QuickBooks integration not yet configured' 
  }, { status: 501 });
}
