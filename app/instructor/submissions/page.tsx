import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireRole } from '@/lib/auth/require-role';
import {

  ClipboardList, CheckCircle2, XCircle, Clock, RotateCcw,
  ChevronRight, Filter,
} from 'lucide-react';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Submissions | Instructor | Elevate For Humanity',
  description: 'Review and grade learner lab, assignment, and checkpoint submissions.',
};

type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';

const STATUS_META: Record<SubmissionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  submitted:          { label: 'Submitted',         color: 'bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200',  icon: <Clock className="w-3.5 h-3.5" /> },
  under_review:       { label: 'Under Review',      color: 'bg-amber-50 text-amber-700 border-amber-200',                 icon: <ClipboardList className="w-3.5 h-3.5" /> },
  approved:           { label: 'Approved',          color: 'bg-green-50 text-green-700 border-green-200',                 icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected:           { label: 'Rejected',          color: 'bg-red-50 text-red-700 border-red-200',                       icon: <XCircle className="w-3.5 h-3.5" /> },
  revision_requested: { label: 'Revision Needed',   color: 'bg-orange-50 text-orange-700 border-orange-200',              icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

const STEP_TYPE_LABELS: Record<string, string> = {
  lab:        'Lab',
  assignment: 'Assignment',
  checkpoint: 'Checkpoint',
  exam:       'Exam',
  quiz:       'Quiz',
};

export default async function InstructorSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; course?: string }>;
}) {
  const { user, profile } = await requireRole(['instructor', 'admin', 'super_admin']);

  const supabase = await createClient();

  const params = await searchParams;
  const filterStatus = params.status as SubmissionStatus | undefined;
  const filterCourse = params.course;

  // Fetch submissions assigned to this instructor (or all, for admin)
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';

  let query = supabase
    .from('step_submissions')
    .select(`
      id,
      user_id,
      course_lesson_id,
      course_id,
      step_type,
      submission_text,
      file_urls,
      status,
      instructor_note,
      reviewed_at,
      created_at,
      profiles:user_id ( full_name, email ),
      course_lessons:course_lesson_id ( title, slug )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!isAdmin) {
    // Instructors see submissions for their assigned courses
    query = query.eq('instructor_id', user.id);
  }

  if (filterStatus) query = query.eq('status', filterStatus);
  if (filterCourse) query = query.eq('course_id', filterCourse);

  const { data: submissions, error } = await query;

  if (error) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Failed to load submissions. Please try again.
      </div>
    );
  }

  // Count by status for filter tabs
  const counts: Record<string, number> = {};
  for (const s of submissions ?? []) {
    counts[s.status] = (counts[s.status] ?? 0) + 1;
  }
  const pendingCount = (counts['submitted'] ?? 0) + (counts['under_review'] ?? 0);

  // Resolve course names
  const courseIds = [...new Set((submissions ?? []).map(s => s.course_id))];
  const { data: courses } = courseIds.length
    ? await supabase.from('training_courses').select('id, course_name').in('id', courseIds)
    : { data: [] };
  const courseNameMap = new Map((courses ?? []).map((c: any) => [c.id, c.course_name]));

  const tabs: Array<{ label: string; value: string | undefined; count?: number }> = [
    { label: 'All', value: undefined, count: submissions?.length ?? 0 },
    { label: 'Needs Review', value: 'submitted', count: counts['submitted'] ?? 0 },
    { label: 'Under Review', value: 'under_review', count: counts['under_review'] ?? 0 },
    { label: 'Approved', value: 'approved', count: counts['approved'] ?? 0 },
    { label: 'Rejected', value: 'rejected', count: counts['rejected'] ?? 0 },
    { label: 'Revision', value: 'revision_requested', count: counts['revision_requested'] ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Instructor', href: '/instructor/dashboard' },
              { label: 'Submissions' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-brand-blue-600" />
              Submissions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {pendingCount > 0
                ? `${pendingCount} submission${pendingCount !== 1 ? 's' : ''} awaiting review`
                : 'No submissions pending review'}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit flex-wrap">
          {tabs.map(tab => {
            const active = filterStatus === tab.value || (tab.value === undefined && !filterStatus);
            const href = tab.value
              ? `/instructor/submissions?status=${tab.value}${filterCourse ? `&course=${filterCourse}` : ''}`
              : `/instructor/submissions${filterCourse ? `?course=${filterCourse}` : ''}`;
            return (
              <Link
                key={tab.label}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-brand-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? 'bg-brand-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Submissions list */}
        {!submissions || submissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No submissions found.</p>
            {filterStatus && (
              <Link
                href="/instructor/submissions"
                className="mt-3 inline-block text-sm text-brand-blue-600 hover:underline"
              >
                Clear filter
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {submissions.map((sub: any) => {
              const statusMeta = STATUS_META[sub.status as SubmissionStatus] ?? STATUS_META.submitted;
              const learner = sub.profiles;
              const lesson = sub.course_lessons;
              const courseName = courseNameMap.get(sub.course_id) ?? sub.course_id;

              return (
                <Link
                  key={sub.id}
                  href={`/instructor/submissions/${sub.id}`}
                  className="flex items-start justify-between px-5 py-4 hover:bg-slate-50 transition group"
                >
                  <div className="flex-1 min-w-0">
                    {/* Learner + lesson */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 group-hover:text-brand-blue-600">
                        {learner?.full_name ?? learner?.email ?? sub.user_id}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-sm text-slate-600 truncate">
                        {lesson?.title ?? sub.course_lesson_id}
                      </span>
                    </div>

                    {/* Course + step type */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">{courseName}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                        {STEP_TYPE_LABELS[sub.step_type] ?? sub.step_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Submission preview */}
                    {sub.submission_text && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {sub.submission_text}
                      </p>
                    )}
                    {sub.file_urls?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {sub.file_urls.length} file{sub.file_urls.length !== 1 ? 's' : ''} attached
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${statusMeta.color}`}>
                      {statusMeta.icon}
                      {statusMeta.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-400 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
