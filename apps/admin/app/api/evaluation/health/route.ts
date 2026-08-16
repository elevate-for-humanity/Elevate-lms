/**
 * Evaluation Health Endpoint
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

interface CapabilityHealth {
  capability: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  configured: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  checkedAt: string;
}

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<CapabilityHealth>> {
  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  const supabase = await requireAdminClient();
  
  // Check AI tasks table
  try {
    const { error } = await supabase.from('ai_tasks').select('id').limit(1);
    checks.push({
      name: 'AI Tasks Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'AI Tasks Table', passed: false, message: 'Check failed' });
    status = 'unavailable';
  }
  
  // Check guardrail enforcement table
  try {
    const { error } = await supabase.from('guardrail_enforcement_log').select('id').limit(1);
    checks.push({
      name: 'Guardrail Log Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
  } catch {
    checks.push({ name: 'Guardrail Log Table', passed: false, message: 'Check failed' });
  }
  
  // Check AI provider
  const hasAiKey = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  checks.push({
    name: 'AI Provider',
    passed: hasAiKey,
    message: hasAiKey ? 'AI provider configured for evaluations' : 'No AI provider - evaluations may be limited',
  });
  
  // Check audit log table
  try {
    const { error } = await supabase.from('platform_audit_events').select('id').limit(1);
    checks.push({
      name: 'Audit Events Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
  } catch {
    checks.push({ name: 'Audit Events Table', passed: false, message: 'Check failed' });
  }
  
  const response: CapabilityHealth = {
    capability: 'evaluations',
    status,
    configured: true,
    checks,
    checkedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(response, {
    status: status === 'unavailable' ? 503 : 200,
  });
}
