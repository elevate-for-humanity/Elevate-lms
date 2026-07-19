import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import {
  LEGAL_ENTITY_OPERATING_LINE,
  LEGAL_ENTITY_SHORT,
  LEGAL_PARTNER_LINE,
} from '@/lib/config/legal-entity';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Legal Entity Structure',
  description:
    'How Elevate for Humanity is organized: legal entity, DBA, DOL apprenticeship sponsor, and nonprofit partner roles for employers and workforce agencies.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal-entity-structure',
  },
};

const ENTITIES = [
  {
    role: 'Legal entity (contracting employer of record)',
    name: '2Exclusive LLC-S',
    detail:
      'Indiana limited liability company. Signs employer agreements, MOUs, and federal apprenticeship paperwork where the sponsor of record is required.',
  },
  {
    role: 'DBA / training provider brand',
    name: 'Elevate for Humanity Career & Technical Institute',
    detail:
      'Public-facing career and technical institute brand used for ETPL-listed training, related technical instruction (RTI), and program marketing.',
  },
  {
    role: 'Apprenticeship sponsor (DOL / RAPIDS)',
    name: PLATFORM_DEFAULTS.orgName,
    detail: `USDOL Registered Apprenticeship sponsor. RAPIDS program number ${RAPIDS_CONFIG.programNumber}. Issues apprenticeship agreements and coordinates RAPIDS reporting for registered occupations.`,
  },
  {
    role: 'Nonprofit partner',
    name: 'Rise Forward Foundation',
    detail:
      'Selfish Inc. d/b/a Rise Forward Foundation — community and workforce partnership activities referenced in operating agreements. Distinct from the training provider legal entity.',
  },
] as const;

export default function LegalEntityStructurePage() {
  return (
    <>
      <PublicLandingPage
        config={{
          breadcrumbs: [
            { label: 'Home', href: '/' },
            { label: 'Compliance', href: '/compliance' },
            { label: 'Legal Entity Structure' },
          ],
          hero: {
            image: '/images/pages/workforce-training.webp',
            tag: 'Governance',
            title: 'Legal Entity Structure',
            subtitle:
              'A single reference for workforce boards, DOL reviewers, employers, and partners — who signs what, and which name appears on public materials.',
          },
          intro: {
            heading: 'Operating structure at a glance',
            paragraphs: [
              LEGAL_ENTITY_OPERATING_LINE,
              `${LEGAL_ENTITY_SHORT} operates workforce training and apprenticeship programs. ${LEGAL_PARTNER_LINE} appears where nonprofit partnership activities apply.`,
              'Use the table below when reviewing contracts, insurance certificates, RAPIDS registrations, or ETPL provider listings.',
            ],
          },
          features: {
            heading: 'Entity roles',
            items: ENTITIES.map((e) => `${e.role}: ${e.name}`),
          },
          steps: {
            heading: 'What to use on common documents',
            items: [
              {
                title: 'Host shop MOU / employer agreement',
                desc: `Signed with ${LEGAL_ENTITY_SHORT} as sponsor; program brand ${RAPIDS_CONFIG.programBrand}.`,
              },
              {
                title: 'RAPIDS / DOL correspondence',
                desc: `Sponsor of record: ${RAPIDS_CONFIG.sponsorOfRecord}. Program ID: ${RAPIDS_CONFIG.programNumber}.`,
              },
              {
                title: 'WIOA / ETPL referrals',
                desc: `Training provider listings use ${PLATFORM_DEFAULTS.orgName} and ETPL-approved program titles.`,
              },
              {
                title: 'Insurance COI certificate holder',
                desc: `Often listed as ${PLATFORM_DEFAULTS.orgName} or ${RAPIDS_CONFIG.programBrand} — confirm on your MOU checklist.`,
              },
            ],
          },
          cta: {
            heading: 'Questions about entity or sponsorship?',
            subtitle: 'Our compliance team can confirm the correct legal name for your document.',
            primaryLabel: 'Contact compliance',
            primaryHref: '/contact?topic=legal-entity',
            secondaryLabel: 'Apprenticeship compliance',
            secondaryHref: '/compliance/apprenticeship-structure',
          },
        }}
      />

      <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Detailed mapping</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-bold text-slate-900">Role</th>
                  <th className="px-4 py-3 font-bold text-slate-900">Name</th>
                  <th className="px-4 py-3 font-bold text-slate-900">Use</th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map((row) => (
                  <tr key={row.role} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-semibold text-slate-800 align-top">{row.role}</td>
                    <td className="px-4 py-3 text-slate-900 align-top">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600 align-top">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs mt-6 leading-relaxed">
            Elevate does not issue professional licenses (barber, cosmetology, nail, etc.). State
            boards issue licenses; Elevate coordinates registered apprenticeship and training
            pathways. Credential verification:{' '}
            <Link href="/credentials" className="text-brand-blue-600 underline">
              /credentials
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
