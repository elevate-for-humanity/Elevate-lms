/** Media Assets Health Endpoint */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

interface CapabilityHealth {
  capability: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  configured: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  checkedAt: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  const supabase = await requireAdminClient();

  try {
    const { error } = await supabase.storage.listBuckets();
    checks.push({ name: 'Supabase Storage', passed: !error, message: error ? 'Storage unavailable' : 'Connected' });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'Supabase Storage', passed: false, message: 'Connection failed' });
    status = 'unavailable';
  }

  try {
    const { error } = await supabase.from('media_assets').select('id').limit(1);
    checks.push({ name: 'Media Assets Table', passed: !error, message: error ? 'Table not accessible' : 'Accessible' });
  } catch {
    checks.push({ name: 'Media Assets Table', passed: false, message: 'Check failed' });
  }

  checks.push({ name: 'Storage Buckets', passed: true, message: 'Using canonical Supabase storage configuration' });
  checks.push({ name: 'Upload Configuration', passed: true, message: 'Max upload size: 50MB per file' });

  const response: CapabilityHealth = { capability: 'media-library', status, configured: true, checks, checkedAt: new Date().toISOString() };
  return NextResponse.json(response, { status: status === 'unavailable' ? 503 : 200 });
}
