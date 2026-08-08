import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Dashboard | Elevate for Humanity',
  description: 'Manage approved programs, students, training progress, and required program-holder actions.',
  robots: { index: false, follow: false },
};

export default async function ProgramHolderDashboard() {
  const { db, holderId, programIds, profile } = await requireProgramHolder();

  const [holderResult, programsResult, studentsResult, pendingHoursResult, documentsResult] = await Promise.all([
    db
      .from('program_holders')
      .select('status, mou_signed, approved_at, payout_status')
      .eq('id', holderId)
      .maybeSingle(),
    programIds.length
      ? db
          .from('programs')
          .select('id, name, title, slug, status, is_active')
          .in('id', programIds)
          .order('title', { ascending: true })
      : Promise.resolve({ data: [] }),
    db
      .from('program_holder_students')
      .select('id, user_id, status, applicant_name, applicant_email, enrolled_at, completion_date, hours_taught, hours_required')
      .eq('program_holder_id', holderId)
      .order('enrolled_at', { ascending: false })
      .limit(25),
    db
      .from('hour_entries')
      .select('id', { count: 'exact', head: true })
      .eq('program_holder_id', holderId)
      .eq('status', 'pending'),
    db
      .from('program_holder_documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
  ]);

  const holder = holderResult.data;
  const programs = programsResult.data ?? [];
  const students = studentsResult.data ?? [];
  const activeStudents = students.filter((student: any) => student.status === 'active').length;
  const completedStudents = students.filter((student: any) => student.status === 'completed').length;
  const pendingHours = pendingHoursResult.count ?? 0;
  const documentCount = documentsResult.count ?? 0;

  const studentUserIds = Array.from(
    new Set(students.map((student: any) => student.user_id).filter(Boolean)),
  ) as string[];

  const { data: studentProfiles } = studentUserIds.length
    ? await db
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentUserIds)
    : { data: [] };

  const profileById = Object.fromEntries(
    (studentProfiles ?? []).map((student: any) => [student.id, student]),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-6 lg:py-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-800">
              Program Holder Portal
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Manage your training programs and students
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Review approved programs, student activity, pending training-hour actions, and your current compliance status from one workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/program-holder/onboarding"
                className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
              >
                Review onboarding
              </Link>
              <Link
                href="/program-holder/rights-responsibilities"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-100"
              >
                Rights & responsibilities
              </Link>
            </div>
          </div>

          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:min-h-[320px]">
            <Image
              src="/images/pages/program-holder-page-1.webp"
              alt="Training provider working with learners"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Approved Programs', programs.length],
            ['Active Students', activeStudents],
            ['Completed', completedStudents],
            ['Pending Hours', pendingHours],
            ['Documents on File', documentCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-slate-950">{String(value)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{String(label)}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Your programs</h2>
                <p className="mt-1 text-sm text-slate-600">Programs currently linked to your approved Program Holder record.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                {holder?.status ?? 'active'}
              </span>
            </div>

            <div className="mt-5 divide-y divide-slate-200">
              {programs.length ? (
                programs.map((program: any) => (
                  <div key={program.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-bold text-slate-950">{program.title || program.name || 'Program'}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {program.is_active ? 'Active' : program.status || 'Pending'}
                      </p>
                    </div>
                    {program.slug ? (
                      <Link
                        href={`/programs/${program.slug}`}
                        className="text-sm font-bold text-blue-700 hover:underline"
                      >
                        View program
                      </Link>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="py-8 text-sm text-slate-700">
                  No active program assignments are linked yet. Contact Elevate if your approved program is missing.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Account status</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="font-semibold text-slate-700">Approval</dt>
                <dd className="font-bold text-slate-950">{holder?.status ?? 'Unknown'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="font-semibold text-slate-700">MOU</dt>
                <dd className="font-bold text-slate-950">{holder?.mou_signed ? 'Signed' : 'Required'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="font-semibold text-slate-700">Payout status</dt>
                <dd className="font-bold text-slate-950">{holder?.payout_status ?? 'Not configured'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-semibold text-slate-700">Pending hour reviews</dt>
                <dd className="font-bold text-slate-950">{pendingHours}</dd>
              </div>
            </dl>
            {!holder?.mou_signed ? (
              <Link
                href="/program-holder/sign-mou"
                className="mt-6 block rounded-lg bg-blue-700 px-5 py-3 text-center font-bold text-white hover:bg-blue-800"
              >
                Sign required MOU
              </Link>
            ) : null}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Student roster</h2>
              <p className="mt-1 text-sm text-slate-600">Recent students connected to this Program Holder record.</p>
            </div>
            <Link href="/support" className="text-sm font-bold text-blue-700 hover:underline">
              Report a roster issue
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="text-slate-700">
                  <th className="px-3 py-3 font-bold">Student</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Hours</th>
                  <th className="px-3 py-3 font-bold">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length ? (
                  students.slice(0, 12).map((student: any) => {
                    const resolvedProfile = student.user_id ? profileById[student.user_id] : null;
                    const name = resolvedProfile?.full_name || student.applicant_name || 'Student';
                    const email = resolvedProfile?.email || student.applicant_email || '';
                    return (
                      <tr key={student.id}>
                        <td className="px-3 py-4">
                          <p className="font-bold text-slate-950">{name}</p>
                          {email ? <p className="text-xs text-slate-600">{email}</p> : null}
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-800">{student.status || 'active'}</td>
                        <td className="px-3 py-4 text-slate-800">
                          {Number(student.hours_taught ?? 0)} / {Number(student.hours_required ?? 0) || '—'}
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('en-US') : '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-700">
                      No students are currently linked to this Program Holder record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
