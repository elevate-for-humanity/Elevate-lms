/**
 * DevStudio AI Chat Health Endpoint
 * 
 * Returns health status for the AI chat subsystem.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Health check response type
interface CapabilityHealth {
  capability: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  configured: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  checkedAt: string;
}

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<CapabilityHealth>> {
  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  
  // Check 1: AI Provider API Key
  const hasAiKey = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  checks.push({
    name: 'AI Provider API Key',
    passed: hasAiKey,
    message: hasAiKey 
      ? 'At least one AI provider configured' 
      : 'No AI provider API key found',
  });
  if (!hasAiKey) status = 'degraded';
  
  // Check 2: Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('studio_conversations').select('id').limit(1);
    checks.push({
      name: 'Supabase Connection',
      passed: !error,
      message: error ? `Error: ${error.message}` : 'Connected',
    });
    if (error) status = 'unavailable';
  } catch (e) {
    checks.push({
      name: 'Supabase Connection',
      passed: false,
      message: 'Failed to connect',
    });
    status = 'unavailable';
  }
  
  // Check 3: AI Chat table exists
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase
      .from('studio_conversations')
      .select('id')
      .limit(1);
    checks.push({
      name: 'Studio Conversations Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
    if (error) status = 'degraded';
  } catch {
    checks.push({
      name: 'Studio Conversations Table',
      passed: false,
      message: 'Table check failed',
    });
    status = 'degraded';
  }
  
  // Check 4: AI Memory table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase
      .from('ai_conversation_memory')
      .select('id')
      .limit(1);
    checks.push({
      name: 'AI Memory Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
  } catch {
    checks.push({
      name: 'AI Memory Table',
      passed: false,
      message: 'Table check failed',
    });
  }
  
  const response: CapabilityHealth = {
    capability: 'ai-chat',
    status,
    configured: hasAiKey,
    checks,
    checkedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(response, {
    status: status === 'unavailable' ? 503 : 200,
  });
}
