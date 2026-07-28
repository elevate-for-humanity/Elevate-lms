/**
 * Content Studio (PARIS) Health Endpoint
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  
  // Check AI provider
  const hasAiKey = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  checks.push({
    name: 'AI Content Provider',
    passed: hasAiKey,
    message: hasAiKey ? 'AI provider configured' : 'No AI provider - content generation disabled',
  });
  if (!hasAiKey) status = 'degraded';
  
  // Check AI memory table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('ai_conversation_memory').select('id').limit(1);
    checks.push({
      name: 'AI Memory Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
  } catch {
    checks.push({ name: 'AI Memory Table', passed: false, message: 'Check failed' });
  }
  
  // Check social campaigns table (for social media content)
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('social_campaigns').select('id').limit(1);
    checks.push({
      name: 'Social Campaigns Table',
      passed: !error,
      message: error ? 'Table not accessible (optional)' : 'Accessible',
    });
  } catch {
    checks.push({ name: 'Social Campaigns Table', passed: false, message: 'Check failed' });
  }
  
  // Check email automation
  const hasResend = !!process.env.RESEND_API_KEY;
  checks.push({
    name: 'Email Provider (Resend)',
    passed: hasResend,
    message: hasResend ? 'Email provider configured' : 'No email provider - email content disabled',
  });
  
  const response: CapabilityHealth = {
    capability: 'content-studio',
    status,
    configured: hasAiKey,
    checks,
    checkedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(response, {
    status: status === 'unavailable' ? 503 : 200,
  });
}
