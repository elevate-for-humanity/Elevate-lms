import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  TAX_CAREER_JOB,
  applicationSchema,
  pretest,
  finalTest,
  gradeExam,
  hiringChecklist,
} from '@/lib/tax-software/recruiting/policy';
import {
  assessments,
  TRAINING_CATEGORY,
  gradeAssessment,
} from '@/lib/tax-software/training/assessment';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
type CandidateNotes = {
  application?: z.infer<typeof applicationSchema>;
  pretest?: { score: number; completedAt: string };
  final?: { score: number; passed: boolean; completedAt: string };
};
function notes(value: string | null): CandidateNotes {
  if (!value) return {};
  return JSON.parse(value) as CandidateNotes;
}
async function context() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const db = await requireAdminClient();
  return { client, user, db };
}
export async function GET() {
  try {
    const c = await context();
    if (!c) return NextResponse.json({ error: 'SIGN_IN_REQUIRED' }, { status: 401, headers });
    const row = await c.db
      .from('job_applications')
      .select('id,status,notes,updated_at')
      .eq('user_id', c.user.id)
      .eq('job_id', TAX_CAREER_JOB)
      .maybeSingle();
    if (row.error) throw row.error;
    const n = notes(row.data?.notes ?? null);
    const progress = await c.db
      .from('staff_training_progress')
      .select('module_id,score,completed_at')
      .eq('user_id', c.user.id)
      .in(
        'module_id',
        assessments.map((a) => a.id),
      );
    if (progress.error) throw progress.error;
    let modules: unknown[] = [];
    if (n.pretest) {
      const m = await c.db
        .from('staff_training_modules')
        .select('id,title,content,order_index')
        .eq('category', TRAINING_CATEGORY)
        .eq('is_active', true)
        .order('order_index');
      if (m.error) throw m.error;
      modules = (m.data ?? []).map((m: { id: string }) => {
        const a = assessments.find((q) => q.id === m.id);
        return { ...m, question: a ? { prompt: a.prompt, options: a.options } : null };
      });
    }
    return NextResponse.json(
      {
        application: row.data
          ? {
              id: row.data.id,
              status: row.data.status,
              application: n.application,
              pretest: n.pretest,
              final: n.final,
            }
          : null,
        pretest: pretest.map((q) => ({ prompt: q.prompt, options: q.options })),
        finalTest: finalTest.map((q) => ({ prompt: q.prompt, options: q.options })),
        modules,
        progress: progress.data ?? [],
        checklist: hiringChecklist,
      },
      { headers },
    );
  } catch {
    return NextResponse.json({ error: 'APPLICATION_UNAVAILABLE' }, { status: 500, headers });
  }
}
const action = z.discriminatedUnion('action', [
  z.object({ action: z.literal('apply'), application: applicationSchema }).strict(),
  z
    .object({
      action: z.enum(['pretest', 'final']),
      answers: z.array(z.number().int()).min(1).max(20),
    })
    .strict(),
  z
    .object({
      action: z.literal('module'),
      moduleId: z.string().uuid(),
      answers: z.array(z.number().int()).length(1),
    })
    .strict(),
]);
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  try {
    const c = await context();
    if (!c) return NextResponse.json({ error: 'SIGN_IN_REQUIRED' }, { status: 401, headers });
    const input = action.safeParse(await req.json().catch(() => null));
    if (!input.success)
      return NextResponse.json({ error: 'INVALID_APPLICATION' }, { status: 400, headers });
    const row = await c.db
      .from('job_applications')
      .select('id,status,notes,updated_at')
      .eq('user_id', c.user.id)
      .eq('job_id', TAX_CAREER_JOB)
      .maybeSingle();
    if (row.error) throw row.error;
    const body = input.data;
    const now = new Date().toISOString();
    if (body.action === 'apply') {
      if (row.data)
        return NextResponse.json({ error: 'APPLICATION_ALREADY_EXISTS' }, { status: 409, headers });
      const inserted = await c.db.from('job_applications').insert({
        user_id: c.user.id,
        student_id: c.user.id,
        job_id: TAX_CAREER_JOB,
        status: 'submitted',
        notes: JSON.stringify({ application: body.application }),
        applied_at: now,
      });
      if (inserted.error) {
        if (inserted.error.code === '23505')
          return NextResponse.json(
            { error: 'APPLICATION_ALREADY_EXISTS' },
            { status: 409, headers },
          );
        throw inserted.error;
      }
      return NextResponse.json({ saved: true }, { status: 201, headers });
    }
    if (!row.data)
      return NextResponse.json({ error: 'APPLICATION_REQUIRED' }, { status: 403, headers });
    const n = notes(row.data.notes);
    if (body.action === 'module') {
      if (!n.pretest)
        return NextResponse.json({ error: 'PRETEST_REQUIRED' }, { status: 403, headers });
      let grade;
      try {
        grade = gradeAssessment(body.moduleId, body.answers);
      } catch {
        return NextResponse.json({ error: 'INVALID_ASSESSMENT' }, { status: 400, headers });
      }
      if (grade.passed) {
        const valid = await c.db
          .from('staff_training_modules')
          .select('id')
          .eq('id', body.moduleId)
          .eq('category', TRAINING_CATEGORY)
          .eq('is_active', true)
          .maybeSingle();
        if (valid.error || !valid.data) throw Error('MODULE_UNAVAILABLE');
        const saved = await c.db.from('staff_training_progress').upsert(
          {
            user_id: c.user.id,
            module_id: body.moduleId,
            status: 'completed',
            score: 100,
            quiz_score: 100,
            completed_at: now,
            updated_at: now,
          },
          { onConflict: 'user_id,module_id' },
        );
        if (saved.error) throw saved.error;
      }
      return NextResponse.json(grade, { headers });
    }
    if (body.action === 'final') {
      if (!n.pretest)
        return NextResponse.json({ error: 'PRETEST_REQUIRED' }, { status: 403, headers });
      const complete = await c.db
        .from('staff_training_progress')
        .select('module_id')
        .eq('user_id', c.user.id)
        .in(
          'module_id',
          assessments.map((a) => a.id),
        )
        .gte('score', 80)
        .not('completed_at', 'is', null);
      if (complete.error) throw complete.error;
      if (
        new Set((complete.data ?? []).map((p: { module_id: string }) => p.module_id)).size !==
        assessments.length
      )
        return NextResponse.json({ error: 'COMPLETE_TRAINING_FIRST' }, { status: 403, headers });
    }
    let grade;
    try {
      grade = gradeExam(body.action, body.answers);
    } catch {
      return NextResponse.json({ error: 'INVALID_ASSESSMENT' }, { status: 400, headers });
    }
    const next: CandidateNotes =
      body.action === 'pretest'
        ? { ...n, pretest: n.pretest ?? { score: grade.score, completedAt: now } }
        : { ...n, final: n.final?.passed ? n.final : { ...grade, completedAt: now } };
    const updated = await c.db
      .from('job_applications')
      .update({ notes: JSON.stringify(next), updated_at: now })
      .eq('id', row.data.id)
      .eq('user_id', c.user.id)
      .eq('updated_at', row.data.updated_at)
      .select('id')
      .maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data)
      return NextResponse.json({ error: 'APPLICATION_CHANGED_RETRY' }, { status: 409, headers });
    return NextResponse.json({ ...grade, hiringDecision: 'Pending human review' }, { headers });
  } catch {
    return NextResponse.json({ error: 'APPLICATION_SAVE_FAILED' }, { status: 500, headers });
  }
}
