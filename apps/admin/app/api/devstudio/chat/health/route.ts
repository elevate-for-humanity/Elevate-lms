/** DevStudio AI Chat Health Endpoint */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
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
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  const hasAiKey = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  checks.push({ name: 'AI Provider API Key', passed: hasAiKey, message: hasAiKey ? 'At least one AI provider configured' : 'No AI provider API key found' });
  if (!hasAiKey) status = 'degraded';

  const supabase = await requireAdminClient();
  try {
    const { error } = await supabase.from('studio_conversations').select('id').limit(1);
    checks.push({ name: 'Supabase Connection', passed: !error, message: error ? 'Connection unavailable' : 'Connected' });
    if (error) status = 'unavailable';
  } catch {
    checks.push({ name: 'Supabase Connection', passed: false, message: 'Failed to connect' });
    status = 'unavailable';
  }

  try {
    const { error } = await supabase.from('studio_conversations').select('id').limit(1);
    checks.push({ name: 'Studio Conversations Table', passed: !error, message: error ? 'Table not accessible' : 'Accessible' });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'Studio Conversations Table', passed: false, message: 'Table check failed' });
    status = 'degraded';
  }

  try {
    const { error } = await supabase.from('ai_conversation_memory').select('id').limit(1);
    checks.push({ name: 'AI Memory Table', passed: !error, message: error ? 'Table not accessible' : 'Accessible' });
  } catch {
    checks.push({ name: 'AI Memory Table', passed: false, message: 'Table check failed' });
  }

  const response: CapabilityHealth = { capability: 'ai-chat', status, configured: hasAiKey, checks, checkedAt: new Date().toISOString() };
  return NextResponse.json(response, { status: status === 'unavailable' ? 503 : 200 });
}
