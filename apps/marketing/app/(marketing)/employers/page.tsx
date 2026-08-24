import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  GraduationCap,
  Handshake,
  ShieldCheck,
  Users,
} from 'lucide-react';
import HeroPicture from '@/components/marketing/HeroPicture';

export const metadata: Metadata = {
  title: 'For Employers | Workforce Solutions | Elevate for Humanity',
  description:
    'Partner with Elevate for Humanity for candidate referrals, work-based learning, registered apprenticeship support, and documented workforce-training pathways.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employers' },
};

const services = [
  {
    icon: Users,
    title: 'Candidate Referrals',
    description:
      'Connect with applicants and completers whose documented training and credentials align with your openings.',
  },
  {
    icon: GraduationCap,
    title: 'Incumbent-Worker Training',
    description:
      'Discuss training options for existing employees. Any workforce funding is subject to the applicable program, employer, participant, and agency requirements.',
  },
  {
    icon: Award,
    title: 'Registered Apprenticeship Support',
    description:
      'Participating employers can work within the approved sponsor structure for occupations actually covered by the registered standards.',
  },
  {
    icon: Handshake,
    title: 'Work-Based Learning',
    description:
      'Coordinate supervised work experience, employer expectations, documentation, and progress tracking for eligible pathways.',
  },
];

export default function EmployerJourneyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <HeroPicture
        src="/images/pages/about-employer-partners.webp"
        alt="Employer partners collaborating on workforce training and hiring"
        microLabel="Employer Partnerships"
        belowHeroHeadline="Build a documented workforce partnership"
        belowHeroSubheadline="Elevate supports hiring, work-based learning, training coordination, and registered apprenticeship activity through documented program and employer workflows."
        ctas={[
          { label: 'Discuss a Partnership', href: '/contact' },
          { label: 'Post a Job', href: '/employers/post-job', variant: 'secondary' },
        ]}
        trustIndicators={['Candidate referrals', 'Work-based learning', 'Apprenticeship support']}
        analyticsName="employer-partnerships"
      />

      <section className="bg-white px-6 py-14">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
              <service.icon className="w-7 h-7 text-brand-blue-700" />
              <h2 className="mt-4 text-xl font-bold text-slate-950">{service.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck className="w-7 h-7 text-emerald-700" />
            <h2 className="text-2xl font-extrabold text-slate-950">Government-facing controls</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              'Funding is not promised at the organization level. Program and participant eligibility must be documented for the applicable funding source.',
              'Registered Apprenticeship status is stated only for occupations included in the canonical sponsor standards and RAPIDS registry used by the platform.',
              'Employer participation does not itself guarantee a tax credit, grant, reimbursement, candidate volume, placement result, or retention outcome.',
              'Material enrollment, funding, apprenticeship, credential, and outcome records are maintained through controlled platform workflows and audit records.',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-none" />
                <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-14">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-slate-950">Start with the exact employer need</h2>
          <p className="mt-4 text-slate-700">
            Tell us the occupation, location, hiring need, training requirement, and whether you are
            asking about a specific public funding or apprenticeship pathway. We will match the
            request to the applicable documented program record.
          </p>
          <Link href="/contact" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-red-700 px-7 py-3.5 font-bold text-white hover:bg-brand-red-800">
            Contact Employer Partnerships <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
