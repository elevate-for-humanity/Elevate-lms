/**
 * Admin — Barber Course Audit
 *
 * Operational visibility table: content completeness + pending sign-offs per lesson.
 * Refreshes on every load (force-dynamic). No caching.
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { BARBER_COURSE_ID } from '@/lib/barber/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Barber Course Audit | Admin',
  robots: 'noindex',
};

interface Lesson {
  id: string;
  slug: string;
  title: string;
  lesson_type: string;
  order_index: number;
  practical_required: boolean;
  passing_score: number | null;
  learning_objectives: unknown[] | null;
  competency_checks: unknown[] | null;
  quiz_questions: unknown[] | null;
  video_url: string | null;
}

interface SignOffCounts {
  pending: number;
  approved: number;
}

function Flag({ ok, label }: { ok: boolean; label?: string }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-green-700 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />{label}</span>
    : <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" />{label ?? 'Missing'}</span>;
}

export default async function BarberCourseAuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/barber-course-audit');

  const db = await getAdminClient();

  // Auth check
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  // Load all lessons
  const { data: lessons } = await db
    .from('course_lessons')
    .select('id, slug, title, lesson_type, order_index, practical_required, passing_score, learning_objectives, competency_checks, quiz_questions, video_url')
    .eq('course_id', BARBER_COURSE_ID)
    .order('order_index');

  // Load pending + approved sign-off counts per lesson
  const { data: submissions } = await db
    .from('step_submissions')
    .select('course_lesson_id, status')
    .eq('course_id', BARBER_COURSE_ID)
    .not('competency_key', 'is', null);

  const signOffMap = new Map<string, SignOffCounts>();
  for (const s of submissions ?? []) {
    const cur = signOffMap.get(s.course_lesson_id) ?? { pending: 0, approved: 0 };
    if (s.status === 'approved') cur.approved++;
    else if (s.status === 'submitted' || s.status === 'under_review') cur.pending++;
    signOffMap.set(s.course_lesson_id, cur);
  }

  const rows = (lessons ?? []) as Lesson[];
  const totalIssues = rows.filter(l => {
    const videoRequired = l.lesson_type !== 'checkpoint' && l.lesson_type !== 'exam';
    return (
      !Array.isArray(l.learning_objectives) || !l.learning_objectives.length ||
      (videoRequired && !l.video_url) ||
      !Array.isArray(l.quiz_questions) || !l.quiz_questions.length ||
      (l.practical_required && (!Array.isArray(l.competency_checks) || !l.competency_checks.length))
    );
  }).length;

  const totalPending = [...signOffMap.values()].reduce((sum, v) => sum + v.pending, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Barber Course Audit</h1>
            <p className="text-xs text-slate-500 mt-0.5">{rows.length} lessons · {totalIssues} content gaps · {totalPending} pending sign-offs</p>
          </div>
          <a
            href="/instructor/submissions?competency=1"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-700 transition"
          >
            <Clock className="w-4 h-4" />
            Review Sign-offs ({totalPending})
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {totalIssues > 0 && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {totalIssues} lesson{totalIssues !== 1 ? 's have' : ' has'} content gaps. Run <code className="font-mono text-xs bg-amber-100 px-1 rounded">pnpm tsx --env-file=.env.local scripts/audit-barber-course.ts --patch</code> to auto-fix passing_score gaps.
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Lesson</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-center px-3 py-3">Objectives</th>
                <th className="text-center px-3 py-3">Video</th>
                <th className="text-center px-3 py-3">Quiz</th>
                <th className="text-center px-3 py-3">Score</th>
                <th className="text-center px-3 py-3">Practical</th>
                <th className="text-center px-3 py-3">Checks</th>
                <th className="text-center px-3 py-3">Pending</th>
                <th className="text-center px-3 py-3">Approved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((l, i) => {
                const objs   = Array.isArray(l.learning_objectives) ? l.learning_objectives.length : 0;
                const quiz   = Array.isArray(l.quiz_questions)      ? l.quiz_questions.length      : 0;
                const checks = Array.isArray(l.competency_checks)   ? l.competency_checks.length   : 0;
                const videoRequired = l.lesson_type !== 'checkpoint' && l.lesson_type !== 'exam';
                const signOffs = signOffMap.get(l.id) ?? { pending: 0, approved: 0 };

                const hasGap =
                  !objs ||
                  (videoRequired && !l.video_url) ||
                  !quiz ||
                  (l.practical_required && !checks);

                return (
                  <tr key={l.id} className={hasGap ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800 truncate max-w-xs">{l.title}</div>
                      <div className="text-xs text-slate-400 font-mono">{l.slug}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {l.lesson_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Flag ok={objs > 0} label={objs > 0 ? String(objs) : undefined} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {videoRequired
                        ? <Flag ok={!!l.video_url} />
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Flag ok={quiz > 0} label={quiz > 0 ? String(quiz) : undefined} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {l.passing_score != null
                        ? <span className="text-green-700 text-xs font-semibold">{l.passing_score}%</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {l.practical_required
                        ? <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Yes</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {l.practical_required
                        ? <Flag ok={checks > 0} label={checks > 0 ? String(checks) : undefined} />
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {signOffs.pending > 0
                        ? <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{signOffs.pending}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {signOffs.approved > 0
                        ? <span className="text-xs font-semibold text-green-700">{signOffs.approved}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
