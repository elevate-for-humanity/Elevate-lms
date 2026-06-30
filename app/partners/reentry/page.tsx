import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Reentry Organization Partners',
  description:
    `${PLATFORM_DEFAULTS.orgName} partners with reentry organizations to provide workforce training for justice-involved individuals. Learn how to refer clients.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/reentry' },
};

export default function ReentryPartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Reentry Partners
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Reentry Organization Partners
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            We partner with reentry organizations, halfway houses, and justice-involved service
            providers to connect returning citizens with workforce training and career credentials.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/contact"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Become a Partner
            </Link>
            <Link
              href="/programs"
              className="border-2 border-white/40 text-slate-900 font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
            What we offer reentry partners
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Priority enrollment for referred clients',
              'Flexible scheduling — evenings and weekends available',
              'Funding navigation — WIOA, JRI, and state grants',
              'Background-friendly programs and employer connections',
              'Progress reporting to case managers',
              'Credential attainment and job placement support',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 border border-slate-200 rounded-lg p-4"
              >
                <CheckCircle className="w-5 h-5 text-brand-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
            Programs well-suited for reentry
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                name: 'HVAC Technician',
                href: '/programs/hvac-technician',
                note: 'High demand, strong wages',
              },
              { name: 'Welding', href: '/programs/welding', note: 'Hands-on, fast credential' },
              {
                name: 'Forklift Operator',
                href: '/programs/forklift',
                note: 'Short program, immediate hire',
              },
              {
                name: 'IT Help Desk',
                href: '/programs/it-help-desk',
                note: 'Remote-friendly career path',
              },
              {
                name: 'Peer Recovery Specialist',
                href: '/programs/peer-recovery-specialist',
                note: 'Lived experience valued',
              },
              {
                name: 'Construction Trades',
                href: '/programs/construction-trades-certification',
                note: 'Union pathway available',
              },
            ].map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="border border-slate-200 rounded-xl p-5 hover:border-brand-red-300 hover:bg-red-50 transition-colors group"
              >
                <h3 className="font-bold text-slate-900 group-hover:text-brand-red-700 mb-1">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500">{p.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">Partner with us</h2>
          <p className="text-slate-600 text-sm mb-6">
            Contact our partnerships team to set up a referral agreement for your organization.
          </p>
          <Link
            href="/contact"
            className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
