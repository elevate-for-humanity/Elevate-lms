import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { getProgramCardImage } from '@/lib/images/programImages';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Program Holder Dashboard | Elevate for Humanity',
  description: 'Manage approved programs, students, training progress, and required program-holder actions.',
  robots: { index: false, follow: false },
};

export default async function ProgramHolderDashboard() {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin') return <AdminOversight />;

  const { db, holderId, programIds, profile } = ctx;
  const [holderRes, programsRes, studentsRes, hoursRes, docsRes] = await Promise.all([
    db.from('program_holders').select('status, mou_signed, approved_at, payout_status, organization_name, name').eq('id', holderId).maybeSingle(),
    programIds.length ? db.from('programs').select('id, name, title, slug, status, is_active').in('id', programIds).order('title') : Promise.resolve({ data: [] }),
    db.from('program_holder_students').select('id, user_id, status, applicant_name, applicant_email, enrolled_at, hours_taught, hours_required').eq('program_holder_id', holderId).order('enrolled_at', { ascending: false }).limit(25),
    db.from('hour_entries').select('id', { count: 'exact', head: true }).eq('program_holder_id', holderId).eq('status', 'pending'),
    db.from('program_holder_documents').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
  ]);

  const holder = holderRes.data;
  const programs = programsRes.data ?? [];
  const students = studentsRes.data ?? [];
  const studentIds = [...new Set(students.map((row: any) => row.user_id).filter(Boolean))] as string[];
  const { data: profiles } = studentIds.length ? await db.from('profiles').select('id, full_name, email').in('id', studentIds) : { data: [] };
  const profilesById = Object.fromEntries((profiles ?? []).map((row: any) => [row.id, row]));
  const activeStudents = students.filter((row: any) => row.status === 'active').length;
  const completedStudents = students.filter((row: any) => row.status === 'completed').length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-6 lg:py-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-800">Program Holder Portal</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{holder?.organization_name || holder?.name || 'Manage your training programs'}</h1>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-700">Programs, student rosters, training hours, documents, and compliance actions in one scoped workspace.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/program-holder/onboarding" className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white">Review onboarding</Link><Link href="/program-holder/rights-responsibilities" className="rounded-lg border border-slate-300 px-5 py-3 font-bold">Rights & responsibilities</Link></div>
          </div>
          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"><Image src="/images/building-maintenance.webp" alt="Training provider working with learners" fill priority className="object-cover" sizes="(max-width:1024px) 100vw,42vw" /></div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Approved Programs" value={programs.length} />
          <Metric label="Active Students" value={activeStudents} />
          <Metric label="Completed" value={completedStudents} />
          <Metric label="Pending Hours" value={hoursRes.count ?? 0} />
          <Metric label="Documents" value={docsRes.count ?? 0} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Your programs</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">{programs.length ? programs.map((program: any) => { const title = program.title || program.name || 'Program'; const slug = String(program.slug || ''); return <article key={program.id} className="overflow-hidden rounded-xl border border-slate-200"><div className="relative aspect-video bg-slate-100"><Image src={getProgramCardImage(slug)} alt={`${title} program`} fill sizes="(max-width:640px) 100vw,50vw" className="object-cover" /></div><div className="p-4"><p className="font-black">{title}</p><p className="mt-1 text-sm text-slate-600">{program.is_active ? 'Active' : program.status || 'Pending'}</p>{slug ? <Link href={`/programs/${slug}`} className="mt-3 inline-flex text-sm font-bold text-blue-700">View program</Link> : null}</div></article>; }) : <p className="col-span-full py-8 text-sm text-slate-600">No program assignments are linked yet.</p>}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Account status</h2><dl className="mt-5 space-y-4"><Status label="Approval" value={holder?.status || 'Unknown'} /><Status label="MOU" value={holder?.mou_signed ? 'Signed' : 'Required'} /><Status label="Payout" value={holder?.payout_status || 'Not configured'} /><Status label="Pending hour reviews" value={String(hoursRes.count ?? 0)} /></dl>{!holder?.mou_signed ? <Link href="/program-holder/sign-mou" className="mt-6 block rounded-lg bg-blue-700 px-5 py-3 text-center font-bold text-white">Sign required MOU</Link> : null}</div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Student roster</h2><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-3">Student</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Hours</th><th className="px-3 py-3">Enrolled</th></tr></thead><tbody className="divide-y divide-slate-100">{students.length ? students.map((student: any) => { const resolved = student.user_id ? profilesById[student.user_id] : null; return <tr key={student.id}><td className="px-3 py-4"><p className="font-bold">{resolved?.full_name || student.applicant_name || 'Student'}</p><p className="text-xs text-slate-600">{resolved?.email || student.applicant_email || ''}</p></td><td className="px-3 py-4">{student.status || 'active'}</td><td className="px-3 py-4">{Number(student.hours_taught ?? 0)} / {Number(student.hours_required ?? 0) || '—'}</td><td className="px-3 py-4">{student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('en-US') : '—'}</td></tr>; }) : <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-600">No students are linked to this Program Holder.</td></tr>}</tbody></table></div></section>
      </div>
    </main>
  );
}

function AdminOversight() {
  const modules = ['Programs', 'Student Rosters', 'Training Hours', 'Documents', 'Compliance', 'Payouts'];
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-6xl space-y-6"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Administrator portal preview</p><h1 className="mt-2 text-3xl font-black text-slate-950">Program Holder PWA</h1><p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">This neutral preview confirms that the Program Holder PWA is operational. No provider, learner roster, hours, document, compliance, or payout record is attached to the administrator session.</p><div className="mt-6 flex flex-wrap gap-3"><a href="https://admin.elevateforhumanity.org/program-holders" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Select a Program Holder in Admin</a><a href="https://admin.elevateforhumanity.org/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950">Return to Admin dashboard</a></div></section><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{modules.map((label) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">{label}</h2><p className="mt-1 text-sm text-slate-600">Available after an authorized Program Holder is selected.</p></article>)}</section></div></main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-black">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{label}</p></div>; }
function Status({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm"><dt className="font-semibold text-slate-600">{label}</dt><dd className="font-black">{value}</dd></div>; }
