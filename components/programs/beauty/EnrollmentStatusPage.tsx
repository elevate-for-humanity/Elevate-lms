import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { enrollmentStatusDisplay } from '@/lib/programs/enrollment-status-display';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';

export default async function EnrollmentStatusPage({slug, title}: {slug:string;title:string}) {
  const db = await createClient();
  const {data:{user},error:authError} = await db.auth.getUser();
  if (authError || !user) redirect(`/login?redirect=${encodeURIComponent(`/programs/${slug}/enrollment-success`)}`);
  const {data:program,error:programError} = await db.from('programs').select('id,title').eq('slug',slug).eq('published',true).eq('is_active',true).maybeSingle();
  if (programError) throw new Error('ENROLLMENT_PROGRAM_LOOKUP_FAILED');
  if (!program) redirect(`/programs/${slug}`);
  const fields = 'id,status,start_date,program_id,user_id';
  const initial = await db.from('program_enrollments').select(fields).eq('user_id',user.id).eq('program_id',program.id).order('enrolled_at',{ascending:false}).limit(1).maybeSingle();
  let enrollment = initial.data;
  if (initial.error) throw new Error('ENROLLMENT_STATUS_LOOKUP_FAILED');
  if (!enrollment && user.email) {
    const result = await db.from('program_enrollments').select(fields).ilike('email',user.email.trim().toLowerCase()).is('user_id',null).eq('program_id',program.id).order('enrolled_at',{ascending:false}).limit(1).maybeSingle();
    if (result.error) throw new Error('ENROLLMENT_STATUS_LOOKUP_FAILED');
    enrollment = result.data;
  }
  if (!enrollment) redirect(`/programs/${slug}/apply`);
  const status = enrollmentStatusDisplay(enrollment.status,enrollment.start_date);
  const dashboardHref = `https://app.elevateforhumanity.org/apprentice?program=${encodeURIComponent(slug)}`;
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950"><div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="relative h-40 sm:h-52"><Image src={getProgramHeroImage(slug)} alt={getProgramImageAlt(slug)} fill sizes="768px" className="object-cover" /></div>
    <div className="p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-wide text-brand-red-700">{program.title || title}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Your enrollment status</h1>
      <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><div><dt className="text-sm text-slate-600">Recorded status</dt><dd className="mt-1 font-bold">{status.label}</dd></div><div><dt className="text-sm text-slate-600">Training start</dt><dd className="mt-1 font-bold">{status.startDateLabel}</dd></div></dl>
      <p className="mt-4 text-sm leading-6 text-slate-700">{status.confirmed ? 'Review the onboarding items assigned in your portal. Admissions confirms your Host Shop, supervision, and training schedule before workplace hours begin.' : 'Payment or an application alone does not confirm enrollment. Complete the required documents, agreements, payment arrangement, and placement review. Admissions confirms when you may begin.'}</p>
      <h2 className="mt-5 text-lg font-black">Your next steps</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Review the enrollment checklist and requests in your portal.</li><li>Complete remaining orientation, identity, and agreement requirements.</li><li>Follow the confirmed start date and approved training location supplied by Admissions.</li></ol>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row"><a href={dashboardHref} className="rounded-xl bg-brand-red-600 px-5 py-3 text-center font-bold text-white">Review my portal checklist</a><Link href={`/programs/${slug}`} className="rounded-xl border border-slate-300 px-5 py-3 text-center font-bold">Review program requirements</Link></div>
    </div>
  </div></main>;
}
