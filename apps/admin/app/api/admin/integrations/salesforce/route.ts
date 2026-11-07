import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getSalesforceClient } from '@/lib/integrations/salesforce';
import { SalesforceError } from '@/lib/integrations/salesforce-client';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  try {
    const client = await getSalesforceClient();
    return NextResponse.json(await client.compatibility(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const code = error instanceof SalesforceError ? error.code : 'SALESFORCE_UNAVAILABLE';
    return NextResponse.json({ connected: false, error: code }, { status: code === 'SALESFORCE_CREDENTIALS_REQUIRED' || code === 'SALESFORCE_INSTANCE_URL_INVALID' ? 409 : 502, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
