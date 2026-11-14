import { NextResponse } from 'next/server';
import { PARIS_IDENTITY } from '@/lib/ai/paris-identity';

export const dynamic = 'force-dynamic';
/** Public metadata cannot prove provider health or expose private workflow data. */
export async function GET() {
  return NextResponse.json({identity:PARIS_IDENTITY,status:'unverified',
    message:'PARIS combines admissions, instruction, operations and compliance. Live execution evidence is available to authorized administrators.',
    timestamp:Date.now()}, {headers:{'cache-control':'no-store'}});
}
