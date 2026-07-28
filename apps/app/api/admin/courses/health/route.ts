/**
 * Course Builder Health Endpoint
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
  
  // Check courses table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('courses').select('id').limit(1);
    checks.push({
      name: 'Courses Table',
      passed: !error,
      message: error ? `Error: ${error.message}` : 'Accessible',
    });
    if (error) status = 'degraded';
  } catch {
    checks.push({ name: 'Courses Table', passed: false, message: 'Connection failed' });
    status = 'unavailable';
  }
  
  // Check modules table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('modules').select('id').limit(1);
    checks.push({
      name: 'Modules Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
  } catch {
    checks.push({ name: 'Modules Table', passed: false, message: 'Check failed' });
  }
  
  // Check lessons table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('lessons').select('id').limit(1);
    checks.push({
      name: 'Lessons Table',
      passed: !error,
      message: error ? 'Table not accessible' : 'Accessible',
    });
  } catch {
    checks.push({ name: 'Lessons Table', passed: false, message: 'Check failed' });
  }
  
  // Check AI course builder
  const hasAiKey = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
  checks.push({
    name: 'AI Course Builder',
    passed: hasAiKey,
    message: hasAiKey ? 'AI provider configured' : 'No AI provider - course builder will use manual mode',
  });
  
  const response: CapabilityHealth = {
    capability: 'course-builder',
    status,
    configured: true,
    checks,
    checkedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(response, {
    status: status === 'unavailable' ? 503 : 200,
  });
}
