import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, TrendingUp, Clock, CheckCircle, Mail, Phone, UserPlus } from 'lucide-react';
import { AdminPageShell, AdminCard, AdminEmptyState, StatusBadge } from '@/components/admin/AdminPageShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Students | Admin',
};

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const { data: students, count: totalStudents } = await db
    .from('profiles')
    .select('id, full_name, first_name, last_name, email, phone, created_at, role, enrollment_status', { count: 'exact' })
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: activeEnrollments } = await db
    .from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active');

  const { count: completedEnrollments } = await db
    .from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed');

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: recentStudents } = await db
    .from('profiles').select('*', { count: 'exact', head: true })
    .eq('role', 'student').gte('created_at', weekAgo.toISOString());

  return (
    <AdminPageShell
      title="Students"
      description="View and manage all registered students and their enrollment status."
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Students' }]}
      stats={[
        { label: 'Total Students',  value: totalStudents || 0,       icon: Users,         color: 'slate' },
        { label: 'Active',          value: activeEnrollments || 0,   icon: TrendingUp,    color: 'green' },
        { label: 'Completed',       value: completedEnrollments || 0,icon: CheckCircle,   color: 'blue' },
        { label: 'New This Week',   value: recentStudents || 0,      icon: UserPlus,      color: 'amber' },
      ]}
      actions={
        <Link href="/admin/students/export"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/20 transition-colors">
          Export CSV
        </Link>
      }
    >
      <AdminCard>
        {students && students.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="col-span-4">Student</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1"></div>
              </div>
              {students.map((student: any) => (
                <div key={student.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors border-t border-slate-100">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-blue-700 font-bold text-xs">
                        {(student.full_name || student.first_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                        {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unnamed'}
                      </p>
                      <p className="text-xs text-slate-400">{student.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                  <div className="col-span-3 space-y-0.5 min-w-0">
                    {student.email && (
                      <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />{student.email}
                      </p>
                    )}
                    {student.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />{student.phone}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">{new Date(student.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status="active" />
                  </div>
                  <div className="col-span-1 text-right">
                    <Link href={`/admin/students/${student.id}`}
                      className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AdminEmptyState message="No students registered yet." />
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
