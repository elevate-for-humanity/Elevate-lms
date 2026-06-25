export const revalidate = 86400;

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SITE_STATS, statLabel } from '@/lib/site-stats';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  GraduationCap,
  Award,
  Users,
  CheckCircle,
  ArrowRight,
  School,
  BarChart3,
  Lightbulb,
  Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'K-12 Workforce Readiness Solutions',
  description:
    'Career and technical education partnerships for K-12 schools. Industry-recognized credentials, dual enrollment, and work-based learning programs aligned to Indiana state standards.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/solutions/k12' },
};

const programs = [
  {
    title: 'HVAC Technician',
    credential: 'EPA 608',
    href: '/programs/hvac-technician',
    sector: 'Skilled Trades',
  },
  {
    title: 'IT Help Desk',
    credential: 'CompTIA A+',
    href: '/programs/it-help-desk',
    sector: 'Technology',
  },
  {
    title: 'Medical Assistant',
    credential: 'NCMA',
    href: '/programs/medical-assistant',
    sector: 'Healthcare',
  },
  {
    title: 'Cybersecurity Analyst',
    credential: 'CompTIA Security+',
    href: '/programs/cybersecurity-analyst',
    sector: 'Technology',
  },
  {
    title: 'Entrepreneurship',
    credential: 'Certiport ESB',
    href: '/programs/entrepreneurship',
    sector: 'Business',
  },
  {
    title: 'Web Development',
    credential: 'Adobe Certified',
    href: '/programs/web-development',
    sector: 'Technology',
  },
];

const features = [
  {
    icon: Award,
    title: 'Industry-Recognized Credentials',
    description:
      'Students earn nationally recognized certifications — EPA 608, CompTIA, NCMA, Certiport — that count toward employment and post-secondary credit.',
  },
  {
    icon: School,
    title: 'Dual Enrollment Pathways',
    description:
      'Partner with Elevate to offer dual enrollment credit. Students complete workforce training that counts toward high school graduation and college credit simultaneously.',
  },
  {
    icon: Users,
    title: 'Work-Based Learning',
    description:
      'Structured internships, job shadows, and pre-apprenticeship programs connect students to local employers before graduation.',
  },
  {
    icon: BarChart3,
    title: 'Outcome Reporting',
    description:
      'Detailed placement and credential attainment data for Perkins V compliance reporting, school board presentations, and grant applications.',
  },
  {
    icon: Lightbulb,
    title: 'Curriculum Alignment',
    description:
      'All programs align to Indiana Academic Standards for CTE and IDOE-approved program of study frameworks.',
  },
  {
    icon: Shield,
    title: 'FERPA-Compliant Data Handling',
    description:
      'Student data is handled in full compliance with FERPA. No student information is shared with third parties without written consent.',
  },
];

const stats = [
  { value: statLabel.placement, label: 'credential attainment rate' },
  { value: `${SITE_STATS.programsOffered}+`, label: 'industry certifications offered' },
  { value: 'Many', label: 'K-12 students served annually' },
  { value: '$0', label: 'cost with Perkins V funding' },
];

export default function K12SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Solutions', href: '/solutions' }, { label: 'K-12' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[clamp(190px,32vw,360px)] w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
          <Image sizes="100vw"
            src="/images/pages/k12-hero.webp"
            alt="K-12 students in a career and technical education classroom"
            fill
            className="object-cover"
            priority 
          />
          <div className="absolute inset-0 bg-slate-900/50" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-5xl mx-auto px-4 pb-10 w-full">
              <span className="inline-block bg-brand-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                K-12 Solutions
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
                Career Readiness for Every Student
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                Industry-recognized credentials, dual enrollment, and work-based learning — built
                for Indiana K-12 schools and CTE programs.
              </p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-brand-blue-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-blue-100 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Built for CTE Directors and School Counselors
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              {PLATFORM_DEFAULTS.orgName} is an ETPL-approved, Perkins V-eligible training provider. We
              handle curriculum, credentialing, and employer connections — so your staff can focus
              on students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Programs Available for K-12 Partnerships
            </h2>
            <p className="text-slate-600">
              All programs lead to industry-recognized credentials and align to IDOE CTE program of
              study frameworks.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-brand-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded-full">
                    {p.sector}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{p.title}</h3>
                <p className="text-sm text-slate-500">Credential: {p.credential}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 text-brand-blue-600 font-medium hover:text-brand-blue-800"
            >
              View all programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10 text-center">
            How a Partnership Works
          </h2>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Discovery Call',
                desc: 'We meet with your CTE director or counselor to understand your student population, existing programs, and Perkins V goals.',
              },
              {
                step: '2',
                title: 'Program Selection',
                desc: 'Together we select programs that align to your program of study frameworks and local employer demand.',
              },
              {
                step: '3',
                title: 'MOU & Funding Setup',
                desc: 'We execute a Memorandum of Understanding and identify Perkins V, WIOA, or grant funding to cover program costs.',
              },
              {
                step: '4',
                title: 'Delivery & Credentialing',
                desc: 'Students complete training and earn industry-recognized credentials. We handle all exam registration and proctoring.',
              },
              {
                step: '5',
                title: 'Outcome Reporting',
                desc: 'We provide placement data, credential attainment rates, and employer feedback for your Perkins V annual report.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-600" />
              Compliance &amp; Eligibility
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'ETPL-Approved Training Provider',
                'Perkins V Eligible Programs',
                'IDOE CTE Framework Aligned',
                'FERPA-Compliant Data Handling',
                'WIOA Title I Compliant',
                'Registered Apprenticeship Sponsor',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />
                  <span className="text-slate-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <GraduationCap aria-label="graduationcap" className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Ready to Build a K-12 Partnership?
          </h2>
          <p className="text-slate-600 mb-8">
            Contact our partnerships team to schedule a discovery call. We work with CTE directors,
            school counselors, and district administrators across Indiana.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
            >
              Schedule a Discovery Call
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
