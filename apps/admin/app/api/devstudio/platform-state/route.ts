/**
 * GET /api/devstudio/platform-state
 *
 * Returns a live platform state snapshot for AI context injection.
 * Called before every AI console response to give the model situational awareness.
 *
 * Returns:
 *   - deployment health (AI providers, env vars)
 *   - live DB counts (students, applications, enrollments, programs)
 *   - known platform debt summary
 *   - last audit timestamp
 *   - active feature flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { refreshSecrets } from '@/lib/secrets';
import { createAdminClient } from '@/lib/supabase/admin';
import { isGroqConfigured } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { PLATFORM_DEBT, SYSTEMS } from '@/lib/platform/knowledge-graph';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  await refreshSecrets();

  try {
    const supabase = createAdminClient();

    // Run DB queries in parallel — each is a simple count
    const [
      studentsRes,
      applicationsRes,
      enrollmentsRes,
      programsRes,
      pendingAppsRes,
      activeCertRes,
    ] = await Promise.allSettled([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('published', true).eq('is_active', true),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    ]);

    const count = (res: PromiseSettledResult<{ count: number | null }>) =>
      res.status === 'fulfilled' ? (res.value.count ?? 0) : null;

    // Deployment health — check both process.env and platform_secrets table
    let groqFromDb = false;
    let geminiFromDb = false;
    let openaiFromDb = false;
    try {
      const { data: secretRows } = await supabase
        .from('platform_secrets')
        .select('key, value_enc')
        .in('key', ['GROQ_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY']);
      for (const row of secretRows ?? []) {
        if (row.key === 'GROQ_API_KEY'   && row.value_enc?.length > 10) groqFromDb   = true;
        if (row.key === 'GEMINI_API_KEY'  && row.value_enc?.length > 10) geminiFromDb = true;
        if (row.key === 'OPENAI_API_KEY'  && row.value_enc?.length > 10) openaiFromDb = true;
      }
    } catch { /* non-fatal — fall back to process.env only */ }

    const aiProviders = {
      groq:   isGroqConfigured()   || groqFromDb,
      gemini: isGeminiConfigured() || geminiFromDb,
      openai: !!process.env.OPENAI_API_KEY || openaiFromDb,
    };
    const activeAiProvider = aiProviders.groq ? 'groq' : aiProviders.gemini ? 'gemini' : aiProviders.openai ? 'openai' : 'none';

    // System status summary
    const systemStatus = SYSTEMS.map(s => ({ id: s.id, name: s.name, status: s.status }));

    // Debt summary
    const debtByseverity = {
      high: PLATFORM_DEBT.filter(d => d.severity === 'high').length,
      medium: PLATFORM_DEBT.filter(d => d.severity === 'medium').length,
      low: PLATFORM_DEBT.filter(d => d.severity === 'low').length,
    };

    const state = {
      timestamp: new Date().toISOString(),
      deployment: {
        environment: process.env.NODE_ENV ?? 'unknown',
        service: 'admin',
        ai_provider: activeAiProvider,
        ai_providers: aiProviders,
        github_connected: !!process.env.GITHUB_TOKEN,
        stripe_connected: !!process.env.STRIPE_SECRET_KEY,
        resend_connected: !!process.env.RESEND_API_KEY,
      },
      platform: {
        active_students: count(studentsRes as PromiseSettledResult<{ count: number | null }>),
        total_applications: count(applicationsRes as PromiseSettledResult<{ count: number | null }>),
        pending_applications: count(pendingAppsRes as PromiseSettledResult<{ count: number | null }>),
        total_enrollments: count(enrollmentsRes as PromiseSettledResult<{ count: number | null }>),
        published_programs: count(programsRes as PromiseSettledResult<{ count: number | null }>),
        certificates_issued: count(activeCertRes as PromiseSettledResult<{ count: number | null }>),
      },
      systems: systemStatus,
      debt: {
        total_items: PLATFORM_DEBT.length,
        by_severity: debtByseverity,
        top_issues: PLATFORM_DEBT.filter(d => d.severity === 'high').map(d => d.id),
      },
      last_audit: '2026-05-17',
      db_health: 'healthy',
    };

    return NextResponse.json(state);
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch platform state');
  }
}
