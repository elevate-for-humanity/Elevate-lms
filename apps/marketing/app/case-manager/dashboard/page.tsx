import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, CheckCircle, Award, Briefcase, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { requireCaseManagerPortal } from '@/lib/auth/case-manager-access';
import { StudentSearchPanel } from '../StudentSearchPanel';

export const metadata: Metadata = { title: 'Case Manager Dashboard | Elevate Workforce Hub', description: 'Participant enrollment, progress, credentials, and placement outcomes.', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CaseManagerDashboardPage() {
  const access = await requireCaseManagerPortal();
  if (access.oversight) return <CaseManagerOversight db={access.db} />;

  const { data: assignments } = await access.supabase.from('case_manager_assignments').select('learner_id, assigned_at, expires_at').eq('case_manager_id', access.user.id);
  const learnerIds = (assignments ?? []).map((row: any) => row.learner_id).filter(Boolean);
  const [profilesRes, activeRes, completedRes, credentialsRes, verifiedPlacementRes, pendingPlacementRes] = learnerIds.length ? await Promise.all([
    access.supabase.from('profiles').select('id, full_name, email, city, state').in('id', learnerIds).order('full_name').limit(100),
    access.supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).in('user_id', learnerIds).eq('status', 'active'),
    access.supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).in('user_id', learnerIds).eq('status', 'completed'),
    access.supabase.from('learner_credentials').select('id', { count: 'exact', head: true }).in('learner_id', learnerIds).eq('status', 'active'),
    access.supabase.from('placement_records').select('id', { count: 'exact', head: true }).in('learner_id', learnerIds).eq('status', 'verified'),
    access.supabase.from('placement_records').select('id', { count: 'exact', head: true }).in('learner_id', learnerIds).eq('status', 'pending'),
  ]) : [{ data: [] }, { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }] as any;

  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-6xl space-y-7">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Workforce Hub</p><h1 className="mt-2 text-3xl font-black">Case Manager Dashboard</h1><p className="mt-2 text-slate-600">Your assigned participants, enrollment progress, credentials, and placement outcomes.</p></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"><Metric label="Assigned" value={learnerIds.length} icon={Users} /><Metric label="Active" value={activeRes.count ?? 0} icon={Clock} /><Metric label="Completed" value={completedRes.count ?? 0} icon={CheckCircle} /><Metric label="Credentials" value={credentialsRes.count ?? 0} icon={Award} /><Metric label="Placements" value={verifiedPlacementRes.count ?? 0} icon={Briefcase} /><Metric label="Pending" value={pendingPlacementRes.count ?? 0} icon={AlertCircle} /></section>
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black">Assigned Participants</h2></div><div className="divide-y divide-slate-100">{(profilesRes.data ?? []).length ? (profilesRes.data ?? []).map((profile: any) => <Link key={profile.id} href={`/case-manager/participants/${profile.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div><p className="font-bold text-slate-900">{profile.full_name || 'Participant'}</p><p className="text-xs text-slate-600">{profile.email || ''}</p></div><ChevronRight className="h-4 w-4 text-slate-400" /></Link>) : <p className="px-5 py-10 text-center text-sm text-slate-600">No participants assigned yet.</p>}</div></section>
    <StudentSearchPanel />
  </div></main>;
}

async function CaseManagerOversight({ db }: { db: any }) {
  const [assignmentsRes, caseManagersRes, activeRes, completedRes, pendingPlacementRes] = await Promise.all([
    db.from('case_manager_assignments').select('case_manager_id, learner_id, assigned_at, expires_at').order('assigned_at', { ascending: false }).limit(100),
    db.from('profiles').select('id, full_name, email').eq('role', 'case_manager').order('full_name').limit(100),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('placement_records').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  const assignments = assignmentsRes.data ?? [];
  const caseManagers = caseManagersRes.data ?? [];
  const managerById = Object.fromEntries(caseManagers.map((row: any) => [row.id, row]));
  const learnerIds = [...new Set(assignments.map((row: any) => row.learner_id).filter(Boolean))] as string[];
  const { data: learners } = learnerIds.length ? await db.from('profiles').select('id, full_name, email').in('id', learnerIds) : { data: [] };
  const learnerById = Object.fromEntries((learners ?? []).map((row: any) => [row.id, row]));
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-6xl space-y-7"><section><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Case Manager Portal · Admin Oversight</p><h1 className="mt-2 text-4xl font-black">Caseload operations</h1><p className="mt-2 max-w-3xl text-slate-600">Platform-wide assignment oversight without assigning the Admin account a fake caseload.</p></section><section className="grid gap-4 sm:grid-cols-4"><Metric label="Case Managers" value={caseManagers.length} icon={Users} /><Metric label="Assignments" value={assignments.length} icon={Briefcase} /><Metric label="Active Enrollments" value={activeRes.count ?? 0} icon={Clock} /><Metric label="Pending Placements" value={pendingPlacementRes.count ?? 0} icon={AlertCircle} /></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Recent caseload assignments</h2><p className="text-sm text-slate-600">{completedRes.count ?? 0} completed enrollments platform-wide.</p></div><a href="https://admin.elevateforhumanity.org/students" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Open Admin students</a></div><div className="mt-4 divide-y divide-slate-100">{assignments.length ? assignments.map((assignment: any, index: number) => <div key={`${assignment.case_manager_id}-${assignment.learner_id}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-bold">{learnerById[assignment.learner_id]?.full_name || assignment.learner_id}</p><p className="text-xs text-slate-600">Case manager: {managerById[assignment.case_manager_id]?.full_name || assignment.case_manager_id}</p></div><Link href={`/case-manager/participants/${assignment.learner_id}`} className="text-sm font-bold text-blue-700">Open participant</Link></div>) : <p className="py-8 text-sm text-slate-600">No case-manager assignments found.</p>}</div></section></div></main>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) { return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="h-5 w-5 text-blue-700" /><p className="mt-3 text-2xl font-black">{value}</p><p className="text-xs font-semibold text-slate-600">{label}</p></div>; }
