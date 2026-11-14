import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, ArrowRight } from 'lucide-react';
import { getAdminClient } from '@/lib/supabase/admin';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Employer Directory | Elevate',
  description: 'Explore employer, host-site, and workforce connections by occupation and view current employment resources.',
};

export const dynamic = 'force-dynamic';

export default async function EmployerDirectoryPage() {
  const db = await getAdminClient();
  const result = db ? await db.from('employers')
    .select('id,business_name,company_name,industry,city,state,description')
    .eq('approved', true).eq('listed_in_directory', true).not('verified_at', 'is', null)
    .order('business_name').limit(100) : { data: [], error: null };
  const employers = result.data || [];

  const employerCategories = [
    { title: 'Healthcare Employers', description: 'Healthcare organizations, clinics, pharmacies, home-care providers, and related employers.', href: '/workforce-board/employment?industry=healthcare' },
    { title: 'Skilled Trades Employers', description: 'HVAC, construction, maintenance, electrical, plumbing, and related trade employers.', href: '/workforce-board/employment?industry=skilled-trades' },
    { title: 'Transportation Employers', description: 'CDL, logistics, warehouse, distribution, and transportation employers.', href: '/workforce-board/employment?industry=transportation' },
    { title: 'Beauty Host Sites', description: 'Barbershops, salons, spas, and nail salons participating in apprenticeship pathways.', href: '/partners/host-shops' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/hero-images/employer-new-hero.webp"
        alt="Employers and workforce partners connecting with trained candidates"
        eyebrow="Employer Connections"
        title="Employer Directory"
        description="Browse verified businesses that have chosen to join the public employer directory, explore openings, or apply to join the employer network."
        actions={(
          <>
            <Link href="/workforce-board/employment" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">View Employment Resources</Link>
            <Link href="/apply/employer" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Become an Employer Partner</Link>
          </>
        )}
      />

      <section className="mx-auto max-w-5xl space-y-6 px-4 py-12">
        <h2 className="text-2xl font-bold">Participating Employers</h2>
        {result.error ? <p>Employer listings could not be loaded. Please try again shortly.</p> : employers.length === 0 ? <p>No verified businesses have opted into the public directory yet. Businesses can apply to join and submit jobs after approval.</p> : <div className="grid gap-6 md:grid-cols-2">{employers.map((employer: any) => <article key={employer.id} className="rounded-xl border p-6">
          <h3 className="text-xl font-bold">{employer.company_name || employer.business_name}</h3>
          <p className="mt-2 text-slate-600">{[employer.industry, employer.city, employer.state].filter(Boolean).join(' · ')}</p>
          {employer.description && <p className="mt-3">{employer.description}</p>}
          <Link className="mt-4 inline-block font-bold text-brand-blue-700" href={`/workforce-board/employment?employer=${employer.id}`}>View Current Openings →</Link>
        </article>)}</div>}
        <Link href="/employers/post-job" className="inline-flex rounded-lg bg-brand-blue-700 px-6 py-3 font-bold text-white">Post a Job</Link>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-slate-950 md:text-3xl">Browse by Employer Type</h2>
            <p className="mt-3 max-w-3xl text-slate-700">These routes lead to live employment or host-site resources instead of static employer names that can become outdated.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {employerCategories.map((category) => (
              <Link key={category.title} href={category.href} className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-blue-300 hover:shadow-md">
                <Building2 className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="text-lg font-bold text-slate-950">{category.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{category.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand-blue-700">Open <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <Users className="mb-4 h-8 w-8 text-brand-green-700" />
              <h2 className="text-xl font-black text-slate-950">Hiring?</h2>
              <p className="mt-3 text-slate-700">Submit the employer partnership application so the workforce team can review your organization and hiring needs.</p>
              <Link href="/apply/employer" className="mt-5 inline-flex items-center font-bold text-brand-blue-700 hover:underline">Employer Application <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <Building2 className="mb-4 h-8 w-8 text-brand-red-700" />
              <h2 className="text-xl font-black text-slate-950">Want to host an apprentice?</h2>
              <p className="mt-3 text-slate-700">Beauty apprenticeship employers should complete the universal Host Site compliance application.</p>
              <Link href="/partners/host-shop/apply" className="mt-5 inline-flex items-center font-bold text-brand-blue-700 hover:underline">Host Site Application <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
