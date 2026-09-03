import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Users, Target, CheckCircle, TrendingUp, Phone, ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Job Placement Services | Career Services',
  keywords: ['job placement', 'career services', 'employment assistance', 'job search'],
  description: 'Get help finding your next job. Our career services team connects graduates with employers and provides ongoing employment support.',
};

export default function JobPlacementPage() {
  const services = [
    { icon: Target, title: 'Resume Optimization', desc: 'ATS-friendly resumes designed to improve clarity and recruiter readability.' },
    { icon: Users, title: 'Employer Connections', desc: 'Introductions to employer and workforce partners when matching opportunities are available.' },
    { icon: Briefcase, title: 'Interview Prep', desc: 'Mock interviews, feedback, and coaching to help you prepare for employer conversations.' },
    { icon: TrendingUp, title: 'Career Coaching', desc: 'Ongoing support for job search strategy, career progression, and workplace readiness.' },
  ];

  const stats = [
    { value: 'Career', label: 'Services Available' },
    { value: 'Active', label: 'Employer Outreach' },
    { value: 'Ongoing', label: 'Graduate Support' },
    { value: 'Direct', label: 'Workforce Referrals' },
  ];
  const phoneHref = `tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`;

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/pathways-page-10.webp"
        alt="Career placement and employment support"
        eyebrow="Career Services"
        title="Job Placement Services"
        description="Training is only part of the pathway. Career services helps you prepare for employers, identify openings, and move from graduation into the workforce."
        actions={(
          <>
            <Link href="/career-services/contact" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Get Placement Help</Link>
            <a href={phoneHref} className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500"><Phone className="mr-2 h-4 w-4" /> Call {PLATFORM_DEFAULTS.supportPhone}</a>
          </>
        )}
      />

      <section className="border-b border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="mb-1 text-3xl font-black text-brand-blue-700 md:text-4xl">{s.value}</div>
                <div className="text-sm font-medium text-slate-700">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">How We Help You Get Hired</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-700">Practical support from application materials through employer follow-up.</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((s) => (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <s.icon className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="mb-2 font-bold text-slate-950">{s.title}</h3>
                <p className="text-sm text-slate-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">Employer & Workforce Connections</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-slate-700">Connections vary by occupation, location, employer demand, funding partner, and student eligibility.</p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {['Healthcare employers', 'Skilled-trades employers', 'Transportation employers', 'Beauty host sites', 'Workforce agencies', 'Community partners', 'Staffing partners', 'Local businesses'].map((category) => (
              <div key={category} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                <p className="text-sm font-semibold text-slate-800">{category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 sm:p-9">
            <h2 className="mb-4 text-2xl font-bold text-slate-950">What placement support includes</h2>
            <div className="space-y-3 text-slate-800">
              {['Resume and application review', 'Interview preparation', 'Employer referrals when opportunities match', 'Workforce partner coordination', 'Follow-up after interviews and placement'].map((item) => (
                <p key={item} className="flex items-start gap-3"><CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-700" /> {item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Ready to Start Your Career?</h2>
          <p className="mb-8 text-slate-300">Our career services team can help you prepare for the next employer opportunity.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/career-services/contact" className="inline-flex items-center rounded-lg bg-brand-red-600 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-red-700">Contact Career Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
            <Link href="/programs" className="inline-flex items-center rounded-lg border-2 border-white px-8 py-4 font-bold text-white transition-colors hover:bg-white hover:text-slate-950">Browse Training Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
