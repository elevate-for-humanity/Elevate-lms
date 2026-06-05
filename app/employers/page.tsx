import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient } from '@/lib/supabase/public';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { loadVerifiedPublicStats } from '@/lib/site-stats-server';
import {
  Users,
  Award,
  DollarSign,
  Building2,
  Briefcase,
  Shield,
  CheckCircle,
  Phone,
} from 'lucide-react';

// PUBLIC ROUTE: employer-facing marketing page — no auth required.
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Employers | Hire, Sponsor & Train Workforce',
  description:
    'Hire pre-credentialed graduates, sponsor DOL-registered apprentices, or co-design training cohorts. OJT wage reimbursement up to 50%. WOTC tax credits. No recruiting fees.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employers',
  },
  openGraph: {
    title: 'Employers',
    description:
      'Hire pre-credentialed graduates, sponsor apprentices, or co-design training cohorts.',
    images: [{ url: '/images/pages/for-employers-page-1.webp' }],
  },
};

export default async function EmployersPage() {
  let employerCount: number | null = null;
  const verified = await loadVerifiedPublicStats();
  const programsDisplay = verified.programsDisplay;

  try {
    const db = createPublicClient();
    const ecRes = await db.from('employer_profiles').select('*', { count: 'exact', head: true });
    employerCount = ecRes.count;
  } catch {
    // DB unavailable — render static fallback
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employers' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[200px] sm:h-[280px] w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/for-employers-page-1.webp"
          alt={`Employer partner meeting with ${PLATFORM_DEFAULTS.orgName} team`}
          fill
          className="object-cover"
          priority
          sizes="100vw" placeholder="empty"
        />
      </section>

      {/* Page identity — below hero */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
            Indianapolis, Indiana
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Hire. Sponsor. Train.
            <br />
            Three ways to work with Elevate.
          </h1>
          <p className="text-slate-600 mt-3 max-w-3xl text-base sm:text-lg leading-relaxed">
            Access our talent pipeline of job-ready candidates trained in healthcare, skilled
            trades, technology, and business. No recruitment fees. WIOA and WOTC eligible.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href="/employer/dashboard"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition text-sm"
            >
              <Building2 className="w-4 h-4" />
              Employer Portal
            </Link>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition text-sm"
            >
              Post a Job — Free
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <section className="bg-brand-blue-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-blue-300">{programsDisplay}</p>
              <p className="text-slate-300 text-sm mt-1">Training Programs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-green-400">{employerCount ?? '50'}+</p>
              <p className="text-slate-300 text-sm mt-1">Employer Partners</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">$0</p>
              <p className="text-slate-300 text-sm mt-1">Recruitment Cost</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-300">WIOA</p>
              <p className="text-slate-300 text-sm mt-1">Funded Training</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three employer paths */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Three Employer Paths
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Hire graduates. Sponsor apprentices. Co-design cohorts.
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              We train candidates to your specifications and deliver them job-ready. You hire with
              confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Path 1: Hire */}
            <div className="bg-white rounded-xl border-t-4 border-brand-green-500 shadow-sm p-6 flex flex-col">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-brand-green-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Hire Pre-Credentialed Graduates
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">
                Candidates complete training, earn industry credentials, pass background checks and
                drug testing — before you interview them. No recruiting fees. WOTC tax credits up
                to $9,600 per eligible hire.
              </p>
              <ul className="space-y-1.5 mb-5">
                {[
                  'Healthcare (CNA, CCMA, CPT)',
                  'Skilled Trades (HVAC, Welding)',
                  'Technology (CompTIA, Certiport)',
                  'Business & Finance',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/employer/dashboard"
                className="bg-brand-green-600 hover:bg-brand-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center transition-colors"
              >
                Browse Talent Pipeline →
              </Link>
            </div>

            {/* Path 2: Sponsor */}
            <div className="bg-white rounded-xl border-t-4 border-brand-blue-500 shadow-sm p-6 flex flex-col">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Award aria-label="award" className="w-5 h-5 text-brand-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sponsor a DOL Apprentice</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">
                Earn-and-learn from day one. Apprentices work in your business while completing
                structured training. OJT wage reimbursement up to 50%. RAPIDS-tracked. DOL
                Certificate of Completion issued.
              </p>
              <ul className="space-y-1.5 mb-5">
                {[
                  'OJT wage reimbursement up to 50%',
                  'RAPIDS-tracked — federal system of record',
                  'DOL Certificate of Completion',
                  'Barber, Cosmetology, Culinary, Trades',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/programs/apprenticeships"
                className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center transition-colors"
              >
                Apprenticeship Programs →
              </Link>
            </div>

            {/* Path 3: Co-design */}
            <div className="bg-white rounded-xl border-t-4 border-slate-500 shadow-sm p-6 flex flex-col">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Co-Design a Training Cohort</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">
                Work with Elevate to design a custom training cohort aligned to your specific job
                requirements. We handle curriculum, compliance, credentialing, and WIOA funding.
              </p>
              <ul className="space-y-1.5 mb-5">
                {[
                  'Custom curriculum to your job specs',
                  'WIOA-funded — no cost to employer',
                  'Cohort scheduling around your hiring timeline',
                  'Dedicated account manager',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact?program=employer"
                className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center transition-colors"
              >
                Talk to Our Team →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Tell Us What You Need',
                desc: 'Share your hiring needs, job requirements, and timeline. We match candidates from our active training programs.',
              },
              {
                step: '2',
                title: 'We Train & Screen Candidates',
                desc: 'Candidates complete industry-specific training, earn certifications, pass background checks, and complete drug testing.',
              },
              {
                step: '3',
                title: 'Interview & Hire',
                desc: 'Review pre-screened candidates, conduct interviews, and hire with confidence. We provide 90-day retention support.',
              },
              {
                step: '4',
                title: 'Claim Tax Credits',
                desc: 'We help you file WOTC paperwork for eligible hires. Credits range from $2,400 to $9,600 per employee.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employer Resources */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">
            Employer Resources
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Employer Portal',
                href: '/employer/dashboard',
                desc: 'Manage jobs, review candidates, track hires',
                Icon: Building2,
              },
              {
                title: 'Post a Job',
                href: '/employer/post-job',
                desc: 'Free job postings to our candidate pool',
                Icon: Briefcase,
              },
              {
                title: 'Talent Pipeline',
                href: '/employer/candidates',
                desc: 'Browse available candidates by skill',
                Icon: Users,
              },
              {
                title: 'Apprenticeships',
                href: '/employer/apprentices',
                desc: 'DOL registered earn-and-learn programs',
                Icon: Award,
              },
              {
                title: 'WOTC & OJT Benefits',
                href: '/employer/dashboard',
                desc: 'WOTC credits, OJT reimbursement, and more',
                Icon: DollarSign,
              },
              {
                title: 'Workforce Compliance',
                href: '/employer/compliance',
                desc: 'Drug testing, I-9, background screening',
                Icon: Shield,
              },
            ].map(({ title, href, desc, Icon }) => (
              <Link
                key={title}
                href={href}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-slate-600 text-sm">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
            No Cost. No Risk.
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            Every employer partner gets
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mt-8">
            {[
              'Pre-screened, credentialed candidates',
              'Free job posting to our candidate pool',
              'WOTC tax credit filing assistance',
              'OJT wage reimbursement up to 50%',
              'Dedicated employer services contact',
              '90-day post-hire retention support',
              'DOL RAPIDS tracking for apprentices',
              'Custom cohort design at no cost',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Your Workforce?</h2>
          <p className="text-slate-300 mb-8 text-lg max-w-2xl mx-auto">
            Contact our employer services team. We&apos;ll match you with trained, certified
            candidates at no recruiting cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply/employer"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-xl font-bold transition text-lg"
            >
              Partner With Us
            </Link>
            <Link
              href="/employer/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition text-lg"
            >
              <Building2 className="w-5 h-5" />
              Employer Portal
            </Link>
            <Link
              href="/contact?program=employer"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition text-lg"
            >
              <Phone className="w-5 h-5" />
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
