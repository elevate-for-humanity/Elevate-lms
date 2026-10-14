import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { officeAccess, OfficeAccessError } from '@/lib/tax-software/server/office-access';
import {
  assessments,
  gradeAssessment,
  TRAINING_CATEGORY,
  TRAINING_VERSION,
} from '@/lib/tax-software/training/assessment';
import { practiceCases } from '@/lib/tax-software/training/practice';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
function fail(e: unknown) {
  return NextResponse.json(
    { error: e instanceof OfficeAccessError ? e.code : 'OFFICE_UNAVAILABLE' },
    { status: e instanceof OfficeAccessError ? e.status : 500, headers },
  );
}
export async function GET(req: NextRequest) {
  try {
    const { db, user, offices, officeIds, ownedIds } = await officeAccess();
    const selected = req.nextUrl.searchParams.get('office');
    if (selected && !officeIds.includes(selected))
      throw new OfficeAccessError(403, 'OFFICE_ACCESS_REQUIRED');
    const ids = selected ? [selected] : officeIds;
    const [modules, progress] = await Promise.all([
      db
        .from('staff_training_modules')
        .select('id,title,content,duration_minutes,order_index')
        .eq('category', TRAINING_CATEGORY)
        .eq('is_active', true)
        .order('order_index'),
      db
        .from('staff_training_progress')
        .select('module_id,score,completed_at')
        .eq('user_id', user.id)
        .in(
          'module_id',
          assessments.map((a) => a.id),
        ),
    ]);
    if (modules.error || progress.error) throw Error('TRAINING_READ_FAILED');
    if (req.nextUrl.searchParams.get('download') === 'manual') {
      const text = [
        '# Supersonic Fast Cash — Staff Workflow Manual',
        `Tax year 2026 · Version ${TRAINING_VERSION}`,
        'Internal software orientation. Preparer modules: 1–6; managers add 7; central administrators complete all 8. Supervisor practical sign-off and applicable credentials remain separate from knowledge-check completion.',
        ...(modules.data ?? []).map(
          (m: { title: string; content: string }) => `## ${m.title}\n\n${m.content}`,
        ),
        '## Fictional practice workbook',
        'TRAINING ONLY. Never transmit these cases to Drake, EPS or the IRS.',
        ...practiceCases.map(
          (c) =>
            `### ${c.title}: ${c.name}\n\n${c.documents.map(([title, body]) => `**${title}**\n${body}`).join('\n\n')}\n\n${c.tasks.map((t) => '- ' + t).join('\n')}\n\nInstructor key: ${c.key}`,
        ),
        '## Daily supervisor checklist',
        'Confirm office and tax year; review missing documents, assigned preparer, calculations, diagnostics, signatures, fee disclosures and handoff reference. Reconcile actual Drake acknowledgments and EPS funding separately. Do not mark an export filed, accepted or funded.',
        '## Provider verification',
        'Drake final filing, bank enrollment and automatic data exchange must be independently verified. The office pending status is not bank approval. Supersonic and Elevate settlement accounts remain separate.',
      ].join('\n\n');
      return new NextResponse(text, {
        headers: {
          ...headers,
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Supersonic_Staff_Manual_TY2026.md"',
        },
      });
    }
    const stages: Record<string, number> = {};
    let offset = 0;
    let returnCount = 0;
    // Paginate to avoid silently truncating a growing multi-office network at the Data API row limit.
    while (true) {
      let query = db
        .from('tax_returns')
        .select('id,status,office_id,preparer_user_id')
        .in('office_id', ids)
        .eq('tax_year', 2026)
        .order('id')
        .range(offset, offset + 499);
      if (!ids.every((id) => ownedIds.includes(id))) query = query.eq('preparer_user_id', user.id);
      const result = await query;
      if (result.error) throw Error('REPORT_READ_FAILED');
      const rows = result.data ?? [];
      for (const row of rows) {
        stages[row.status] = (stages[row.status] ?? 0) + 1;
        returnCount++;
      }
      if (rows.length < 500) break;
      offset += 500;
    }
    const clients = await db
      .from('tax_clients')
      .select('id', { count: 'exact', head: true })
      .in('office_id', ids);
    const staff = await db
      .from('tax_preparers')
      .select('user_id,first_name,last_name,office_id,status')
      .in('office_id', ids)
      .eq('status', 'active');
    if (clients.error || staff.error) throw Error('REPORT_READ_FAILED');
    const visibleStaff = (staff.data ?? []).filter(
      (s: { office_id: string; user_id: string }) =>
        ownedIds.includes(s.office_id) || s.user_id === user.id,
    );
    const staffIds = [
      ...new Set([
        user.id,
        ...visibleStaff
          .map((s: { user_id: string | null }) => s.user_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ]),
    ];
    const completions = await db
      .from('staff_training_progress')
      .select('user_id,module_id,score,completed_at')
      .in('user_id', staffIds)
      .in(
        'module_id',
        assessments.map((a) => a.id),
      );
    if (completions.error) throw Error('TRAINING_REPORT_FAILED');
    const recruitmentOffice = offices.find(
      (o: { id: string; office_code: string }) =>
        o.office_code === 'SFC-IND-001' && ownedIds.includes(o.id),
    );
    let candidates: {
      id: string;
      name: string;
      preference: string;
      credential: string;
      status: string;
      pretestScore: number | null;
      finalScore: number | null;
      finalPassed: boolean;
    }[] = [];
    let candidateCount = 0;
    if (recruitmentOffice) {
      const applications = await db
        .from('job_applications')
        .select('id,status,notes', { count: 'exact' })
        .eq('job_id', 'supersonic-tax-professional')
        .order('applied_at', { ascending: false })
        .range(0, 99);
      if (applications.error) throw Error('RECRUITMENT_READ_FAILED');
      candidateCount = applications.count ?? 0;
      candidates = (applications.data ?? []).map(
        (row: { id: string; status: string; notes: string | null }) => {
          const record = JSON.parse(row.notes ?? '{}') as {
            application?: { name?: string; preference?: string; credential?: string };
            pretest?: { score: number };
            final?: { score: number; passed: boolean };
          };
          return {
            id: row.id,
            name: record.application?.name ?? 'Application',
            preference: record.application?.preference ?? '',
            credential: record.application?.credential ?? '',
            status: row.status,
            pretestScore: record.pretest?.score ?? null,
            finalScore: record.final?.score ?? null,
            finalPassed: record.final?.passed ?? false,
          };
        },
      );
    }
    return NextResponse.json(
      {
        hasRecruitingAccess: Boolean(recruitmentOffice),
        candidates,
        candidateCount,
        offices,
        returnCount,
        clientCount: clients.count ?? 0,
        stages,
        staff: visibleStaff,
        completions: completions.data ?? [],
        generatedAt: new Date().toISOString(),
        version: TRAINING_VERSION,
        modules: (modules.data ?? []).map((m: { id: string }) => {
          const a = assessments.find((a) => a.id === m.id);
          return { ...m, question: a ? { prompt: a.prompt, options: a.options } : null };
        }),
        progress: progress.data ?? [],
      },
      { headers },
    );
  } catch (e) {
    return fail(e);
  }
}
const bodySchema = z
  .object({ moduleId: z.string().uuid(), answers: z.array(z.number().int()).length(1) })
  .strict();
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  try {
    const { db, user } = await officeAccess();
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json({ error: 'INVALID_ASSESSMENT' }, { status: 400, headers });
    let result;
    try {
      result = gradeAssessment(parsed.data.moduleId, parsed.data.answers);
    } catch {
      return NextResponse.json({ error: 'INVALID_ASSESSMENT' }, { status: 400, headers });
    }
    const module = await db
      .from('staff_training_modules')
      .select('id')
      .eq('id', parsed.data.moduleId)
      .eq('category', TRAINING_CATEGORY)
      .eq('is_active', true)
      .maybeSingle();
    if (module.error) throw Error('MODULE_READ_FAILED');
    if (!module.data)
      return NextResponse.json({ error: 'MODULE_UNAVAILABLE' }, { status: 404, headers });
    if (!result.passed) return NextResponse.json(result, { headers });
    const old = await db
      .from('staff_training_progress')
      .select('score,completed_at,started_at')
      .eq('user_id', user.id)
      .eq('module_id', parsed.data.moduleId)
      .maybeSingle();
    if (old.error) throw Error('PROGRESS_READ_FAILED');
    const score = Math.max(result.score, old.data?.score ?? 0);
    const now = new Date().toISOString();
    const saved = await db.from('staff_training_progress').upsert(
      {
        user_id: user.id,
        module_id: parsed.data.moduleId,
        status: score >= 80 ? 'completed' : 'in_progress',
        score,
        quiz_score: score,
        started_at: old.data?.started_at ?? now,
        completed_at: score >= 80 ? (old.data?.completed_at ?? now) : null,
        updated_at: now,
      },
      { onConflict: 'user_id,module_id' },
    );
    if (saved.error) throw Error('PROGRESS_SAVE_FAILED');
    return NextResponse.json(result, { headers });
  } catch (e) {
    return fail(e);
  }
}
