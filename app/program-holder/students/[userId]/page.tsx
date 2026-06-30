import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { canAccessStudent } from '@/lib/program-holder-access';

export const dynamic = 'force-dynamic';

export default async function ProgramHolderStudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { db, holderId } = await requireProgramHolder();

  const allowed = await canAccessStudent(holderId, userId);
  if (!allowed) {
    redirect('/program-holder/students');
  }

  const [{ data: profile }, { data: phRow }] = await Promise.all([
    db.from('profiles').select('id, full_name, email, phone').eq('id', userId).maybeSingle(),
    db
      .from('program_holder_students')
      .select('id, status, enrolled_at, completed_at, hours_taught, hours_required, notes')
      .eq('program_holder_id', holderId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (!profile) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/program-holder/students"
        className="text-sm text-brand-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to students
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{profile.full_name || 'Student'}</h1>
      <p className="text-slate-600 text-sm mt-1">{profile.email}</p>

      {phRow && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-sm">
          <p>
            <span className="text-slate-500">Status:</span>{' '}
            <span className="font-medium text-slate-900">{phRow.status}</span>
          </p>
          {phRow.enrolled_at && (
            <p>
              <span className="text-slate-500">Enrolled:</span>{' '}
              {new Date(phRow.enrolled_at).toLocaleDateString()}
            </p>
          )}
          {(phRow.hours_taught != null || phRow.hours_required != null) && (
            <p>
              <span className="text-slate-500">Hours:</span>{' '}
              {phRow.hours_taught ?? 0} / {phRow.hours_required ?? '—'}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/program-holder/hours"
          className="px-4 py-2 bg-brand-blue-600 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-700"
        >
          Review pending hours
        </Link>
        <Link
          href="/program-holder/documents"
          className="px-4 py-2 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-50"
        >
          Documents
        </Link>
        <Link
          href="/program-holder/dashboard"
          className="px-4 py-2 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-50"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
