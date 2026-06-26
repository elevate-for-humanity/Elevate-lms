// PUBLIC ROUTE: demo seed — disabled, returns 200
// AUTH: Intentionally public — no authentication required
import { NextResponse } from 'next/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST() {
  // Demo seeding is disabled in production
  return NextResponse.json({ ok: true, message: 'Demo environment ready' });
}
export const POST = withApiAudit('/api/demo/seed', _POST);
