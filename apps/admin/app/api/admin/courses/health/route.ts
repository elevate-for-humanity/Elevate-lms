/** Course Builder Health Endpoint */
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
    const { error } = await supabase.from('courses').select('id').limit(1);
    checks.push({ name: 'Courses Table', passed: !error, message: error ? 'Table not accessible' : 'Accessible' });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'Courses Table', passed: false, message: 'Connection failed' });
    status = 'unavailable';
  }

  try {
    const { error } = await supabase.from('modules').select('id').limit(1);
    checks.push({ name: 'Modules Table', passed: !error, message: error ? 'Table not accessible' : 'Accessible' });
  } catch {
    checks.push({ name: 'Modules Table', passed: false, message: 'Check failed' });
  }

  try {
    const { error } = await supabase.from('lessons').select('id').limit(1);
    checks.push({ name: 'Lessons Table', passed: !error, message: error ? 'Table not accessible' : 'Accessible' });
  } catch {
    checks.push({ name: 'Lessons Table', passed: false, message: 'Check failed' });
  }

  const hasAiKey = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  checks.push({ name: 'AI Course Builder', passed: hasAiKey, message: hasAiKey ? 'AI provider configured' : 'No AI provider - course builder will use manual mode' });

  const response: CapabilityHealth = { capability: 'course-builder', status, configured: true, checks, checkedAt: new Date().toISOString() };
  return NextResponse.json(response, { status: status === 'unavailable' ? 503 : 200 });
}
