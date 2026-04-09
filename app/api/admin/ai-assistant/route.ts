import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Admin AI Assistant API
 *
 * Admin-only endpoint. Answers operational questions about live data:
 * applications, enrollments, students, revenue, programs, compliance.
 * Has read access to real DB counts via adminClient.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ADMIN_SYSTEM_PROMPT = `You are the Elevate for Humanity Admin Operations Assistant. You help admin staff manage day-to-day operations.

You have access to live data summaries provided in each message. Use them to answer questions accurately.

Your capabilities:
- Summarize application pipeline (pending, in review, approved, rejected counts)
- Report on enrollment numbers and active learners
- Summarize revenue collected vs pending
- Identify at-risk or inactive learners
- Report on program enrollment breakdown
- Summarize compliance and WIOA status
- Guide admins to the right page for specific actions

Navigation shortcuts you can reference:
- Applications: /admin/applications
- Students: /admin/students
- Enrollments: /admin/enrollments
- Programs: /admin/programs
- WIOA: /admin/wioa
- Funding: /admin/funding
- Compliance: /admin/compliance
- Reports: /admin/reports
- Certificates: /admin/certificates
- At-Risk: /admin/at-risk

Rules:
- Be direct and operational. No fluff.
- Always cite the data provided when answering questions about counts or status.
- If you don't have the data to answer, say so and link to the relevant admin page.
- Keep responses concise — 2-5 sentences unless a detailed breakdown is requested.
- Never make up numbers. Only use the live data snapshot provided.`;

async function getLiveDataSnapshot(db: SupabaseClient) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    pendingApps,
    totalApps,
    activeEnrollments,
    totalStudents,
    revenueMonth,
    revenueAll,
    certs,
    unpublishedPrograms,
    inactiveCount,
  ] = await Promise.all([
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']),
    db.from('applications').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
    db.from('certificates').select('id', { count: 'exact', head: true }),
    db.from('programs').select('id', { count: 'exact', head: true }).eq('published', false).neq('status', 'archived'),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active').lt('updated_at', new Date(Date.now() - 3 * 86400000).toISOString()),
  ]);

  const revenueMonthCents = (revenueMonth.data ?? []).reduce((s: number, r: any) => s + (r.amount_paid_cents ?? 0), 0);
  const revenueAllCents = (revenueAll.data ?? []).reduce((s: number, r: any) => s + (r.amount_paid_cents ?? 0), 0);

  return `
LIVE DATA SNAPSHOT (as of ${now.toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET):
- Pending applications (awaiting review): ${pendingApps.count ?? 0}
- Total applications (all time): ${totalApps.count ?? 0}
- Active enrollments: ${activeEnrollments.count ?? 0}
- Total students in system: ${totalStudents.count ?? 0}
- Revenue this month: $${(revenueMonthCents / 100).toLocaleString('en-US')}
- Revenue all time: $${(revenueAllCents / 100).toLocaleString('en-US')}
- Certificates issued (all time): ${certs.count ?? 0}
- Unpublished programs (blocking enrollment): ${unpublishedPrograms.count ?? 0}
- Inactive learners (no activity 3+ days): ${inactiveCount.count ?? 0}
`.trim();
}

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const db = await getAdminClient();
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) {
      return safeError('Forbidden', 403);
    }

    const { message, history = [] } = await req.json();
    if (!message?.trim()) return safeError('Message required', 400);

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return safeError('AI not configured', 503);

    // Get live data snapshot to inject into context
    const dataSnapshot = await getLiveDataSnapshot(db);

    const messages = [
      { role: 'system', content: ADMIN_SYSTEM_PROMPT },
      { role: 'system', content: dataSnapshot },
      ...history.slice(-8), // last 8 messages for context
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error('OpenAI error:', err instanceof Error ? err : undefined);
      return safeError('AI service error', 502);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'No response generated.';

    return NextResponse.json({ reply });
  } catch (err) {
    return safeInternalError(err, 'Admin AI assistant failed');
  }
}
