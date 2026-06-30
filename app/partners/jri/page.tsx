import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { canonicalRoutes } from '@/lib/routes/canonical-routes';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Job Ready Indy (JRI)',
  description:
    `${PLATFORM_DEFAULTS.orgName} is a Job Ready Indy approved training provider. JRI funding covers tuition for eligible Marion County residents.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/jri' },
};

export default function JriPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/pages/wioa-meeting.webp"
            alt="Job Ready Indy approved training"
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Job Ready Indy · Marion County</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">Marion County pays for your training.</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
            Job Ready Indy (JRI) covers full tuition for eligible Marion County residents. No loans, no repayment. We're an approved JRI provider — our team handles the application with you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/eligibility" className="text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">
              Check Eligibility
            </Link>
            <Link href="/apply" className="text-center border border-white/30 text-white font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
          {[
            {
              title: 'Who qualifies',
              body: 'Marion County residents who are unemployed or underemployed and meet income guidelines.',
            },
            {
              title: 'What it covers',
              body: 'Full tuition for approved high-demand programs. No repayment required.',
            },
            {
              title: 'How to apply',
              body: 'Apply through Elevate — our team handles the JRI application process with you.',
            },
          ].map((card) => (
            <div key={card.title} className="border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
            JRI-approved programs at Elevate
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: 'HVAC Technician', href: canonicalRoutes.programs.hvacTechnician },
              { name: 'IT Help Desk', href: '/programs/it-help-desk' },
              { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
              { name: 'Medical Assistant', href: '/programs/medical-assistant' },
              {
                name: 'CNA / Nursing Assistant',
                href: canonicalRoutes.programs.certifiedNursingAssistant,
              },
              { name: 'Welding', href: '/programs/welding' },
            ].map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="flex items-center justify-between border border-slate-200 rounded-lg px-5 py-4 hover:border-brand-red-300 hover:bg-red-50 transition-colors group"
              >
                <span className="font-semibold text-slate-800 group-hover:text-brand-red-700">
                  {p.name}
                </span>
                <span className="text-brand-red-600 text-sm font-bold">View →</span>
              </Link>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Additional programs may qualify. Contact us to confirm JRI eligibility for your chosen
            program.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">Ready to get started?</h2>
          <p className="text-slate-600 text-sm mb-6">
            Check your eligibility and apply — our team handles the JRI paperwork with you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/check-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check Eligibility
            </Link>
            <Link
              href="/contact"
              className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
