import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import {
  Users,
  FileText,
  Award,
  TrendingUp,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Video,
  Calendar,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Program Holder Portal',
  robots: { index: false, follow: false },
};

export default async function ProgramHolderPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/portal');

  // requireProgramHolder resolves holderId, programIds, and enforces role + MOU
  const ctx = await requireProgramHolder();
  const { holderId, programIds } = ctx;

  const db = await requireAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, role, organization_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile && !['program_holder', 'admin', 'super_admin'].includes(profile.role ?? '')) {
    redirect('/portals');
  }

  // Resolve program_holder_id from profile for enrollment queries
  const { data: phProfile } = await db
    .from('profiles')
    .select('program_holder_id')
    .eq('id', user.id)
    .maybeSingle();
  const programHolderId = phProfile?.program_holder_id ?? null;

  const [
    { data: programs },
    { count: totalStudents },
    { count: activeEnrollments },
    { count: completedEnrollments },
    { count: pendingDocs },
    { count: certificates },
  ] = await Promise.all([
    // Programs linked via program_holder_programs join table — programs has no holder_id column
    programIds.length > 0
      ? db
          .from('programs')
          .select('id, title, slug, status')
          .in('id', programIds)
          .order('title')
          .limit(10)
      : Promise.resolve({ data: [] }),
    // program_enrollments uses program_holder_id, not holder_id
    db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_holder_id', holderId),
    db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_holder_id', holderId)
      .eq('status', 'active'),
    db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_holder_id', holderId)
      .eq('status', 'completed'),
    // program_holder_documents uses user_id, not holder_id
    db
      .from('program_holder_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending'),
    db.from('certificates').select('*', { count: 'exact', head: true }).eq('issued_by', user.id),
  ]);

  const NAV = [
    {
      label: 'Students',
      href: '/program-holder/portal/students',
      icon: Users,
      count: totalStudents ?? 0,
      desc: 'View and manage enrolled students',
    },
    {
      label: 'Attendance',
      href: '/program-holder/portal/attendance',
      icon: Calendar,
      count: activeEnrollments ?? 0,
      desc: 'Track attendance and participation',
    },
    {
      label: 'Messages',
      href: '/program-holder/portal/messages',
      icon: MessageSquare,
      count: null,
      desc: 'Communicate with students and staff',
    },
    {
      label: 'Live Q&A',
      href: '/program-holder/portal/live-qa',
      icon: Video,
      count: null,
      desc: 'Host and manage live sessions',
    },
    {
      label: 'Documents',
      href: '/program-holder/dashboard',
      icon: FileText,
      count: pendingDocs ?? 0,
      desc: 'Compliance docs and agreements',
      badge: (pendingDocs ?? 0) > 0,
    },
    {
      label: 'Certificates',
      href: '/program-holder/dashboard',
      icon: Award,
      count: certificates ?? 0,
      desc: 'Issued program certificates',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">
            Program Holder
          </p>
          <h1 className="text-xl font-bold text-slate-900">
            {profile?.organization_name ?? profile?.full_name ?? 'Portal'}
          </h1>
        </div>
        <Link
          href="/program-holder/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Full Dashboard <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: 'Total Students',
              value: totalStudents ?? 0,
              icon: Users,
              color: 'text-blue-500',
            },
            {
              label: 'Active',
              value: activeEnrollments ?? 0,
              icon: TrendingUp,
              color: 'text-brand-green-500',
            },
            {
              label: 'Completed',
              value: completedEnrollments ?? 0,
              icon: Award,
              color: 'text-purple-500',
            },
            {
              label: 'Pending Docs',
              value: pendingDocs ?? 0,
              icon: FileText,
              color: (pendingDocs ?? 0) > 0 ? 'text-red-500' : 'text-slate-400',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon className={`w-5 h-5 ${s.color} mb-3`} />
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Nav cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Icon className="w-6 h-6 text-brand-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{item.label}</p>
                    {item.badge && (
                      <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* Programs */}
        {programs && programs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-red-500" /> Your Programs
              </h2>
              <Link
                href="/program-holder/dashboard"
                className="text-sm text-brand-red-600 hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {programs.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3">
                  <p className="text-sm font-medium text-slate-900">{p.title}</p>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === 'published' ? 'bg-brand-green-50 text-brand-green-700' : 'bg-amber-50 text-amber-700'}`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
