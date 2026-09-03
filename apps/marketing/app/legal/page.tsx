import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Legal Documents & Policies',
  description: `Canonical legal, privacy, enrollment, platform-use, security, accessibility, and compliance documents for ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/legal' },
};

const groups = [
  {
    title: 'Privacy, security & accessibility',
    links: [
      { title: 'Privacy Policy', href: '/privacy', desc: 'How information is collected, used, shared, retained, and protected.' },
      { title: 'Security & Data Protection', href: '/security-and-data-protection', desc: 'Platform security controls and data-protection practices.' },
      { title: 'Accessibility Statement', href: '/accessibility', desc: 'Accessibility target, remediation practices, and accommodation route.' },
      { title: 'Data Sharing Agreement', href: '/legal/data-sharing', desc: 'Partner data-sharing responsibilities and boundaries.' },
      { title: 'FERPA Consent', href: '/legal/ferpa-consent', desc: 'Education-record consent documentation where applicable.' },
    ],
  },
  {
    title: 'Platform & commercial terms',
    links: [
      { title: 'Terms of Service', href: '/terms-of-service', desc: 'General terms governing use of Elevate websites, training services, accounts, platform features, and related services.' },
      { title: 'End User License Agreement', href: '/legal/eula', desc: 'Terms governing use of Elevate software and digital services.' },
      { title: 'Acceptable Use Agreement', href: '/legal/acceptable-use', desc: 'Permitted and prohibited use of technology resources.' },
      { title: 'Software License Agreement', href: '/legal/license-agreement', desc: 'License terms for organizations using the platform.' },
      { title: 'Program License Agreement', href: '/legal/program-license-agreement', desc: 'Terms governing licensed delivery of Elevate training programs by external organizations.' },
      { title: 'Marketplace Terms', href: '/legal/marketplace-terms', desc: 'Terms governing purchases through the Elevate store.' },
    ],
  },
  {
    title: 'Program & partner documents',
    links: [
      { title: 'Enrollment Agreement', href: '/legal/enrollment-agreement', desc: 'Enrollment terms and participant obligations.' },
      { title: 'Participation Agreement', href: '/legal/participation-agreement', desc: 'Participant responsibilities, conduct expectations, acknowledgments, and rights.' },
      { title: 'Employer Agreement', href: '/legal/employer-agreement', desc: 'Terms for participating employers and work-based learning relationships.' },
      { title: 'Partner Memorandum of Understanding', href: '/legal/partner-mou', desc: 'Organizational partner responsibilities and operating expectations.' },
      { title: 'Policies', href: '/policies', desc: 'Academic, enrollment, conduct, refund, and related operational policies.' },
      { title: 'Grievance Policy', href: '/grievance', desc: 'Complaint and grievance process.' },
    ],
  },
  {
    title: 'Governance & compliance',
    links: [
      { title: 'Required Disclosures', href: '/legal/disclosures', desc: 'Program, approval, accreditation, and regulatory disclosures.' },
      { title: 'Governance', href: '/legal/governance', desc: 'Organizational and platform governance information.' },
      { title: 'Equal Opportunity', href: '/equal-opportunity', desc: 'Nondiscrimination and equal-opportunity policy.' },
      { title: 'Federal Compliance & Program Controls', href: '/federal-compliance', desc: 'Evidence-based summary of workforce, apprenticeship, privacy, accessibility, and security controls.' },
      { title: 'Satisfactory Academic Progress', href: '/satisfactory-academic-progress', desc: 'Academic progress and appeal standards where applicable.' },
    ],
  },
] as const;

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Legal' }]} />
        </div>
      </div>

      <section className="bg-slate-950 px-4 py-14 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Canonical Document Index</p>
          <h1 className="mt-3 text-4xl font-black">Legal Documents & Policies</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Use this index for the current public legal and policy routes governing {PLATFORM_DEFAULTS.orgName} programs, platform use, privacy, partner operations, and compliance controls.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          Signed enrollment, employment, funding, testing, licensing, or partner agreements may contain additional terms. When a signed agreement conflicts with a general website summary, the applicable executed agreement and governing law control to the extent permitted by law.
        </div>

        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="text-2xl font-black">{group.title}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.links.map((doc) => (
                  <Link key={doc.href} href={doc.href} className="rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:bg-slate-50">
                    <h3 className="font-black text-slate-950">{doc.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{doc.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-xl font-black">Need a document or clarification?</h2>
          <p className="mt-2 leading-7 text-slate-700">Contact us if an agreement, policy, disclosure, or accessible copy is needed for an enrollment, agency review, procurement, or partner audit.</p>
          <Link href="/contact" className="mt-5 inline-flex rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">Contact us</Link>
        </div>
      </section>
    </main>
  );
}
