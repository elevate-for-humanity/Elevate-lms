import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  Handshake,
  ShieldCheck,
  Users,
} from 'lucide-react';

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
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="py-20 px-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-7">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Employer Partnerships</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold max-w-4xl">Build a documented workforce partnership</h1>
          <p className="text-lg text-slate-300 max-w-3xl mt-6 leading-relaxed">
            Elevate supports hiring, work-based learning, training coordination, and registered
            apprenticeship activity. Public claims are limited to results and statuses that can be
            supported by current records.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-7 py-3.5 rounded-lg font-bold">
              Discuss a Partnership <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/employers/post-job" className="inline-flex items-center gap-2 border border-white/20 hover:bg-white/5 px-7 py-3.5 rounded-lg font-bold">
              <Briefcase className="w-4 h-4" /> Post a Job
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-7">
              <service.icon className="w-7 h-7 text-blue-400" />
              <h2 className="text-xl font-bold mt-4">{service.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mt-3">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 bg-slate-900/60 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <h2 className="text-2xl font-extrabold">Government-facing controls</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              'Funding is not promised at the organization level. Program and participant eligibility must be documented for the applicable funding source.',
              'Registered Apprenticeship status is stated only for occupations included in the canonical sponsor standards and RAPIDS registry used by the platform.',
              'Employer participation does not itself guarantee a tax credit, grant, reimbursement, candidate volume, placement result, or retention outcome.',
              'Material enrollment, funding, apprenticeship, credential, and outcome records are maintained through controlled platform workflows and audit records.',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-white/10 p-5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-none" />
                <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold">Start with the exact employer need</h2>
          <p className="text-slate-400 mt-4">
            Tell us the occupation, location, hiring need, training requirement, and whether you are
            asking about a specific public funding or apprenticeship pathway. We will match the
            request to the applicable documented program record.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 mt-7 bg-white text-slate-950 px-7 py-3.5 rounded-lg font-bold hover:bg-slate-100">
            Contact Employer Partnerships <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
