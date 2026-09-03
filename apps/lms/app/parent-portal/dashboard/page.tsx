import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Phone, Mail, ShieldCheck } from 'lucide-react';
import { requireParentPortal, getVerifiedParentLinks } from '@/lib/auth/parent-access';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Parent & Guardian Dashboard', robots: { index: false, follow: false } };

export default async function ParentDashboardPage() {
  const access = await requireParentPortal();
  if (access.isPlatformAdmin) return <ParentAdminOversight />;

  const links = await getVerifiedParentLinks(access.user.id);
  const studentIds = links.map((link: any) => link.student_id).filter(Boolean);
  const [{ data: profiles }, { data: enrollments }] = await Promise.all([
    studentIds.length ? access.supabase.from('profiles').select('id, full_name, email').in('id', studentIds) : Promise.resolve({ data: [] }),
    studentIds.length ? access.supabase.from('program_enrollments').select('id, user_id, status, enrollment_state, progress_percent, enrolled_at, programs(title, slug)').in('user_id', studentIds) : Promise.resolve({ data: [] }),
  ]);
  const profileById = Object.fromEntries((profiles ?? []).map((profile: any) => [profile.id, profile]));
  const enrollmentByStudent: Record<string, any[]> = {};
  for (const enrollment of enrollments ?? []) {
    const userId = (enrollment as any).user_id;
    (enrollmentByStudent[userId] ||= []).push(enrollment);
  }

  const students = links.map((link: any) => ({
    id: link.student_id,
    relationship: link.relationship || 'guardian',
    profile: profileById[link.student_id],
    enrollments: enrollmentByStudent[link.student_id] || [],
  }));
  const firstName = access.profile.full_name?.split(' ')[0] || 'Guardian';

  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-5xl space-y-7">
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Parent & Guardian Portal</p><h1 className="mt-2 text-4xl font-black text-slate-950">Welcome, {firstName}</h1><p className="mt-2 text-slate-600">View verified student relationships, program enrollment, and training progress.</p></section>

    {students.length ? <section className="space-y-5">{students.map((student: any) => <article key={student.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50"><GraduationCap className="h-5 w-5 text-blue-700" /></div><div><p className="text-lg font-black text-slate-950">{student.profile?.full_name || 'Student'}</p><p className="text-sm capitalize text-slate-600">{student.relationship} · verified</p></div></div><Link href={`/parent-portal/student/${student.id}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">Full view <ArrowRight className="h-4 w-4" /></Link></div><div className="divide-y divide-slate-100">{student.enrollments.length ? student.enrollments.map((enrollment: any) => { const progress = Math.max(0, Math.min(100, Number(enrollment.progress_percent ?? 0))); return <div key={enrollment.id} className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-slate-900">{enrollment.programs?.title || 'Program'}</p><p className="text-xs text-slate-600">{enrollment.enrollment_state || enrollment.status || 'unknown'}</p></div><span className="font-black">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${progress}%` }} /></div></div>; }) : <p className="p-5 text-sm text-slate-600">No program enrollments found.</p>}</div></article>)}</section> : <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-amber-700" /><h2 className="mt-3 text-xl font-black text-amber-950">No verified student links</h2><p className="mt-2 text-sm text-amber-900">A coordinator must verify the parent/student relationship before student records are visible.</p></section>}

    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><p className="font-black">Need help?</p><p className="text-sm text-slate-600">Contact the program coordinator.</p></div><div className="flex gap-2"><a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"><Phone className="mr-1 inline h-4 w-4" />Call</a><a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"><Mail className="mr-1 inline h-4 w-4" />Email</a></div></section>
  </div></main>;
}

async function ParentAdminOversight() {
  const db = await requireAdminClient();
  const [{ count: verifiedLinks }, { count: pendingLinks }, { count: linkedStudents }] = await Promise.all([
    db.from('parent_student_links').select('student_id', { count: 'exact', head: true }).eq('verified', true),
    db.from('parent_student_links').select('student_id', { count: 'exact', head: true }).eq('verified', false),
    db.from('parent_student_links').select('student_id', { count: 'exact', head: true }),
  ]);
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-5xl"><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Parent Portal · Admin Oversight</p><h1 className="mt-2 text-4xl font-black">Guardian access oversight</h1><p className="mt-2 max-w-3xl text-slate-600">Admin may enter the portal without being assigned a fake parent relationship. Student detail still requires an explicit student selection.</p><div className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="Verified relationships" value={verifiedLinks ?? 0} /><Metric label="Pending verification" value={pendingLinks ?? 0} /><Metric label="Relationship records" value={linkedStudents ?? 0} /></div><div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Support workflow</h2><p className="mt-2 text-sm text-slate-600">Use Admin student search to select a student, then open that student through the Parent Portal detail route for support verification.</p><a href="https://admin.elevateforhumanity.org/students" className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Open Admin student search</a></div></div></main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-black">{value}</p><p className="text-sm font-semibold text-slate-600">{label}</p></div>; }
