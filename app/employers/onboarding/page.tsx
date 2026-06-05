import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { RAPIDS_SPONSOR_LABEL } from '@/lib/workforce-ids';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Employer Onboarding',
  description: `How to partner with ${PLATFORM_DEFAULTS.orgName} — interest form, partnership meeting, MOU, and candidate placement.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/employers/onboarding' },
};

const STEPS = [
  {
    step: 1,
    title: 'Complete interest form',
    detail: 'Tell us your industry, hiring needs, and whether you want graduates, apprentices, or OJT participants.',
    href: '/apply/employer',
    cta: 'Employer Application',
  },
  {
    step: 2,
    title: 'Meet with partnership team',
    detail: 'We review fit, WOTC/OJT eligibility, and apprenticeship host requirements if applicable.',
    href: '/contact?topic=employer-partnership',
    cta: 'Schedule a Call',
  },
  {
    step: 3,
    title: 'Sign MOU or host agreement',
    detail: 'Executed partnership documents define roles, supervision, and compliance reporting.',
    href: '/legal/employer-agreement',
    cta: 'View Agreement Template',
  },
  {
    step: 4,
    title: 'Receive candidates or apprentices',
    detail: 'Prescreened, credentialed, or apprenticeship-matched talent through the employer portal.',
    href: '/employer/dashboard',
    cta: 'Employer Portal',
  },
];

export default function EmployerOnboardingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs
          items={[{ label: 'Employers', href: '/employers' }, { label: 'Onboarding' }]}
        />
      </div>

      <section className="bg-slate-900 text-white py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-3">Employer Partnership Onboarding</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Four steps from interest to hiring. {RAPIDS_SPONSOR_LABEL} for registered
            apprenticeship pathways.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        {STEPS.map((s) => (
          <div key={s.step} className="flex gap-4 rounded-xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white font-extrabold flex items-center justify-center shrink-0">
              {s.step}
            </div>
            <div className="flex-1">
              <h2 className="font-extrabold text-slate-900">{s.title}</h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{s.detail}</p>
              <Link href={s.href} className="inline-block mt-3 text-sm font-bold text-brand-red-600 hover:underline">
                {s.cta} →
              </Link>
            </div>
          </div>
        ))}

        <div className="rounded-xl bg-brand-blue-50 border border-brand-blue-100 p-5 text-sm text-slate-700">
          <p className="font-bold text-slate-900 mb-2">ROI for employers</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>Reduced recruiting cost — prescreened candidates</li>
            <li>OJT wage reimbursement up to 50% (when eligible)</li>
            <li>WOTC tax credits up to $9,600 per eligible hire</li>
            <li>DOL apprenticeship sponsorship without building your own program</li>
          </ul>
        </div>

        <Link
          href="/employers/directory"
          className="block text-center text-sm font-bold text-brand-blue-700 hover:underline"
        >
          Browse employer partner directory →
        </Link>
      </section>
    </div>
  );
}
