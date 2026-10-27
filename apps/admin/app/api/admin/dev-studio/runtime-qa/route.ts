import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

interface RuntimeError {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  source: 'console' | 'api' | 'build' | 'typescript' | 'network';
  message: string;
  source_file?: string;
  line_number?: number;
  stack?: string;
  resolved: boolean;
  auto_fixable: boolean;
  fix_applied?: string;
}

interface BuildCheck {
  type: 'lint' | 'typecheck' | 'build';
  status: 'passed' | 'failed' | 'running' | 'skipped';
  errors: number;
  warnings: number;
  last_run?: string;
  details?: string[];
}

type ApiHealth = {
  status: 'healthy' | 'degraded';
  latency_ms: number;
  endpoints_tested: number;
  failures: number;
};

type SupabaseHealth = {
  status: 'connected' | 'error';
  latency_ms: number;
};

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();

    const historyDb = await requireAdminClient();
    const { data: storedErrors, error: historyError } = await historyDb
      .from('system_errors')
      .select('id,created_at,error_type,error_message,error_stack,status,context')
      .order('created_at', { ascending: false }).limit(100);
    if (historyError) return NextResponse.json({ error: 'Runtime error history unavailable' }, { status: 503 });
    const errors: RuntimeError[] = (storedErrors ?? []).map(error => ({
      id: error.id, timestamp: error.created_at, level: 'error', source: 'api',
      message: error.error_message || error.error_type || 'Recorded server error',
      stack: error.error_stack ?? undefined,
      resolved: error.status === 'resolved', auto_fixable: false,
    }));

    const apiStart = Date.now();
    const apiHealth: ApiHealth = {
      status: 'healthy',
      latency_ms: 0,
      endpoints_tested: 0,
      failures: 0,
    };
    try {
      const result = await supabase.from('profiles').select('id').limit(1);
      if (result.error) throw result.error;
      apiHealth.latency_ms = Date.now() - apiStart;
      apiHealth.endpoints_tested = 1;
    } catch {
      apiHealth.status = 'degraded';
      apiHealth.failures = 1;
    }

    const supabaseStart = Date.now();
    const supabaseHealth: SupabaseHealth = { status: 'connected', latency_ms: 0 };
    try {
      const result = await supabase.auth.getUser();
      if (result.error || !result.data.user) throw result.error || new Error('Session validation failed');
      supabaseHealth.latency_ms = Date.now() - supabaseStart;
    } catch {
      supabaseHealth.status = 'error';
    }

    const build_checks: BuildCheck[] = (['lint', 'typecheck', 'build'] as const).map(type => ({
      type, status: 'skipped', errors: 0, warnings: 0,
      details: ['This runtime probe does not execute repository validation.'],
    }));
    const cloudflareHealth = { status: 'not_tested', assets_tested: 0, failures: 0 };

    const summary = {
      total_errors: errors.filter((e) => !e.resolved).length,
      critical_errors: errors.filter((e) => e.level === 'error' && !e.resolved).length,
      auto_fixable_count: errors.filter((e) => e.auto_fixable && !e.resolved).length,
      score: null,
      scope: 'recent_recorded_server_errors',
    };

    return NextResponse.json({
      errors: errors.filter((e) => !e.resolved),
      build_checks,
      api_health: apiHealth,
      supabase_health: supabaseHealth,
      cloudflare_health: cloudflareHealth,
      summary,
    });
  } catch (err) {
    console.error('Runtime QA error:', err);
    return NextResponse.json({ error: 'QA check failed' }, { status: 500 });
  }
}
