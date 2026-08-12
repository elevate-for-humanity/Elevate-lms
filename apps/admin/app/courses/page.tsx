import { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Courses | Elevate Admin',
  description: 'Manage canonical LMS courses in the unified Course Builder.',
};

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  is_active: boolean | null;
  duration_hours: number | null;
  program_id: string | null;
  compliance_profile_key: string | null;
  updated_at: string | null;
};

export default async function CoursesPage() {
  const db = await requireAdminClient();
  const [{ data: courses, error: coursesError }, { data: enrollments }] = await Promise.all([
    db
      .from('courses')
      .select(
        'id,title,slug,status,is_active,duration_hours,program_id,compliance_profile_key,updated_at',
      )
      .order('updated_at', { ascending: false })
      .limit(250),
    db
      .from('program_enrollments')
      .select('course_id')
      .not('course_id', 'is', null)
      .limit(10000),
  ]);

  if (coursesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-lg font-bold text-slate-900">Course inventory unavailable</h1>
          <p className="mt-2 text-sm text-red-700">{coursesError.message}</p>
        </div>
      </div>
    );
  }

  const enrollmentCount = new Map<string, number>();
  for (const enrollment of enrollments ?? []) {
    const courseId = enrollment.course_id as string | null;
    if (!courseId) continue;
    enrollmentCount.set(courseId, (enrollmentCount.get(courseId) ?? 0) + 1);
  }

  const rows = (courses ?? []) as CourseRow[];
  const published = rows.filter((course) => course.status === 'published').length;
  const active = rows.filter((course) => course.is_active).length;
  const governed = rows.filter((course) => Boolean(course.compliance_profile_key)).length;
  const totalDirectEnrollments = [...enrollmentCount.values()].reduce((sum, value) => sum + value, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue-600">
                Canonical course inventory
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-900">Courses</h1>
              <p className="mt-1 text-sm text-slate-600">
                Every authoring action opens the same Admin Course Builder. Programs and courses are
                no longer presented as the same record type.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/course-builder?tab=templates"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <BookOpen className="h-4 w-4" /> Templates
              </Link>
              <Link
                href="/course-builder?tab=build"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700"
              >
                <Plus className="h-4 w-4" /> Create Course
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={BookOpen} label="Courses" value={rows.length} />
            <Metric icon={CheckCircle2} label="Published" value={published} />
            <Metric icon={ShieldCheck} label="Governed" value={governed} />
            <Metric icon={Users} label="Direct enrollments" value={totalDirectEnrollments} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{active} course record(s) are currently marked active.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No canonical courses yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create one manually, from a template, by document import, or with the AI generator.
            </p>
            <Link
              href="/course-builder?tab=templates"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-blue-700"
            >
              <Plus className="h-4 w-4" /> Open Course Builder
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <Header>Course</Header>
                    <Header>Hours</Header>
                    <Header>Enrollments</Header>
                    <Header>Compliance</Header>
                    <Header>Status</Header>
                    <Header>Updated</Header>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{course.title}</div>
                        <div className="mt-0.5 font-mono text-xs text-slate-500">{course.slug}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {course.duration_hours ? `${course.duration_hours} hrs` : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        {enrollmentCount.get(course.id) ?? 0}
                      </td>
                      <td className="px-4 py-4">
                        {course.compliance_profile_key ? (
                          <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            {course.compliance_profile_key}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700">Needs profile</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={course.status} active={course.is_active} />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/course-builder?courseId=${encodeURIComponent(course.id)}&tab=build`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Build
                          </Link>
                          <Link
                            href={`/course-builder?courseId=${encodeURIComponent(course.id)}&tab=compliance`}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Governance
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status, active }: { status: string | null; active: boolean | null }) {
  const published = status === 'published';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        published
          ? 'bg-green-50 text-green-700'
          : active
            ? 'bg-amber-50 text-amber-700'
            : 'bg-slate-100 text-slate-600'
      }`}
    >
      {published ? 'Published' : active ? 'Active draft' : status ?? 'Draft'}
    </span>
  );
}
