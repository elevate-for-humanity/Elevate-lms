import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PartnerLearningPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { user } = await requireRole(['student', 'learner', 'admin']);
  const { enrollmentId } = await params;
  const supabase = await createClient();
  const { data: enrollment, error } = await supabase
    .from('partner_lms_enrollments')
    .select(`id,student_id,course_id,status,progress_percentage,external_account_id,metadata,
      partner_lms_courses(id,course_name,course_description,description,duration_hours),
      partner_lms_providers(id,provider_name,website_url,support_email,metadata)`)
    .eq('id', enrollmentId)
    .eq('student_id', user.id)
    .maybeSingle();
  if (error || !enrollment) notFound();

  const record = enrollment as any;
  const course = enrollment.partner_lms_courses as any;
  const provider = enrollment.partner_lms_providers as any;
  const { data: internalCourse } = enrollment.course_id
    ? await supabase.from('courses').select('title,description,duration_hours').eq('id', enrollment.course_id).maybeSingle()
    : { data: null };
  const title = course?.course_name || internalCourse?.title || record.metadata?.credential || 'Partner training';
  const description = course?.course_description || course?.description || internalCourse?.description || 'Your training is delivered and tracked by the approved external provider.';
  const providerUrl = provider?.website_url;
  const instructions = provider?.metadata?.instructions || 'Use your provider account to open training, testing, or scheduling.';

  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-4xl space-y-6">
    <section className="rounded-3xl bg-slate-950 p-7 text-white"><p className="text-xs font-black uppercase tracking-widest text-blue-300">External provider course</p><h1 className="mt-2 text-3xl font-black">{title}</h1><p className="mt-3 max-w-3xl text-slate-200">{description}</p><div className="mt-5 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-white/10 px-3 py-1">Provider: {provider?.provider_name || 'Approved partner'}</span><span className="rounded-full bg-white/10 px-3 py-1 capitalize">Status: {String(enrollment.status).replace(/_/g, ' ')}</span>{internalCourse?.duration_hours || course?.duration_hours ? <span className="rounded-full bg-white/10 px-3 py-1">{internalCourse?.duration_hours || course?.duration_hours} hours</span> : null}</div></section>
    <section className="rounded-2xl border border-blue-200 bg-white p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 text-blue-700"/><div><h2 className="text-xl font-black">Provider access instructions</h2><p className="mt-2 text-slate-700">{instructions}</p>{enrollment.external_account_id ? <p className="mt-4 rounded-xl bg-blue-50 p-4"><span className="text-xs font-black uppercase tracking-wide text-blue-800">Provider username</span><br/><span className="font-mono text-lg font-black text-slate-950">{enrollment.external_account_id}</span></p> : null}<p className="mt-3 text-sm text-slate-600">Passwords are never displayed or stored in the learner portal. Use the provider’s password-reset process if needed.</p></div></div></section>
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6"><h2 className="font-black text-amber-950">How progress is recorded</h2><p className="mt-2 text-amber-900">This course does not use Elevate LMS lessons. Certiport activity is tracked through provider reporting and verified completion evidence.</p><p className="mt-2 font-bold text-amber-950">Current recorded progress: {Number(enrollment.progress_percentage || 0)}%</p></section>
    <div className="flex flex-wrap gap-3">{providerUrl ? <a href={providerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white">Open {provider?.provider_name || 'provider'} <ExternalLink className="h-4 w-4"/></a> : null}<Link href="/lms/courses" className="rounded-xl border border-slate-400 bg-white px-5 py-3 font-black">Back to My Courses</Link><Link href="/lms/support" className="rounded-xl border border-slate-400 bg-white px-5 py-3 font-black">Get help</Link></div>
  </div></main>;
}
