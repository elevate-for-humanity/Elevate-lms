import { NextResponse } from 'next/server';
import { prepareDeploy } from '@/lib/autopilot/deploy-prep';
import { apiRequireAdmin } from '@/lib/authGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Alias for /api/autopilot/deploy
export async function POST() {
  const result = await prepareDeploy();
  return NextResponse.json(result);
}

export async function GET() {
  const result = await prepareDeploy();
  return NextResponse.json(result);
}
