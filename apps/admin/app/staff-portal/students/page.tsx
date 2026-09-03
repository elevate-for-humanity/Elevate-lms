import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireStaffPortalAccess } from '@/lib/staff-portal/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Management | Staff Portal',
  description: 'View and manage student records and progress.',
  robots: { index: false, follow: false },
};

export default async function StudentsPage() {
  await requireStaffPortalAccess();
  const supabase = await createClient();

  const { data: students, count } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at', { count: 'exact' })
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-slate-600">
              <li><Link href="/staff-portal" className="hover:text-brand-blue-700">Staff Portal</Link></li>
              <li>/</li>
              <li className="font-medium text-slate-900">Students</li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Student Management</h1>
              <p className="mt-2 text-slate-600">{count || 0} students enrolled</p>
            </div>
            <Link
              href="/staff-portal/students/add"
              className="rounded-lg bg-brand-blue-600 px-4 py-2 font-semibold text-white hover:bg-brand-blue-700"
            >
              Add Student
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <p className="text-sm text-slate-600">Most recent student records</p>
          </div>
          <div className="divide-y divide-slate-100">
            {students && students.length > 0 ? (
              students.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-100">
                      <span className="font-medium text-brand-blue-700">{(student.full_name || 'S')[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{student.full_name || 'Student'}</p>
                      <p className="truncate text-sm text-slate-600">{student.email}</p>
                    </div>
                  </div>
                  <Link
                    href={`/staff-portal/students/${student.id}`}
                    className="shrink-0 text-sm font-semibold text-brand-blue-700 hover:underline"
                  >
                    View Profile
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-600">No students found.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
