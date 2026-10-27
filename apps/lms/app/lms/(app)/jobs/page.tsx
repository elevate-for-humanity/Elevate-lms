import { Metadata } from 'next';
import Link from 'next/link';
import { BriefcaseBusiness, ArrowRight } from 'lucide-react';
import LiveJobPostings from '@/components/careers/LiveJobPostings';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Career Opportunities | Elevate LMS',
  description: 'Current employer opportunities for Elevate learners and graduates.',
  robots: { index: false, follow: false },
};

export default async function LearnerJobsPage() {
  const supabase = await createClient();
  const { data: cdlProgram } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', 'cdl-training')
    .maybeSingle();
  const { data: cdlPartnerships } = cdlProgram?.id
    ? await supabase
        .from('employer_partnerships')
        .select('employer_id')
        .eq('program_id', cdlProgram.id)
        .eq('status', 'active')
    : { data: [] };
  const employerIds = (cdlPartnerships ?? []).map((row: any) => row.employer_id);
  const { data: cdlEmployers } = employerIds.length
    ? await supabase
        .from('employers')
        .select('id,company_name,business_name,description,city,state,website_url')
        .in('id', employerIds)
        .eq('approved', true)
    : { data: [] };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 pt-6 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-950 p-6 text-white md:p-8">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300"><BriefcaseBusiness className="h-4 w-4" />Career Opportunities</div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Move from training into employment.</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Browse current employer opportunities while keeping your training, credentials, community, and career support in one learner experience.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/lms/certificates" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900">My credentials <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/lms/support" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white">Career support</Link>
          </div>
        </div>
      </section>
      <LiveJobPostings limit={18} heading="Current Employer Opportunities" className="pt-8" />
      <section className="px-4 pb-12 md:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-blue-700">CDL employment network</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Approved CDL employer partners</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Eligible CDL graduates may be routed to approved partners after completion is verified and the learner grants employment-sharing consent. Every employer makes its own hiring decision.
          </p>
          {(cdlEmployers ?? []).length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(cdlEmployers ?? []).map((employer: any) => (
                <article key={employer.id} className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-black text-slate-950">{employer.company_name || employer.business_name}</h3>
                  {(employer.city || employer.state) && <p className="mt-1 text-sm text-slate-600">{[employer.city, employer.state].filter(Boolean).join(', ')}</p>}
                  {employer.description && <p className="mt-2 text-sm leading-6 text-slate-700">{employer.description}</p>}
                  {employer.website_url && <a className="mt-3 inline-flex min-h-11 items-center font-bold text-brand-blue-700" href={employer.website_url} target="_blank" rel="noreferrer">Employer website</a>}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              CDL employer partnerships are under verification. Approved partners will appear here automatically.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
