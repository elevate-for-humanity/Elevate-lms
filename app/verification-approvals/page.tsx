import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Verification & Approvals | Elevate for Humanity',
  description: 'Verifiable registrations, approvals, and compliance documentation for 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/verification-approvals' },
};

const verifications = [
  {
    category: 'Federal Apprenticeship Registration',
    items: [
      { label: 'RAPIDS Program Number', value: '2025-IN-132301' },
      { label: 'Sponsor of Record', value: '2Exclusive LLC-S' },
      { label: 'DBA', value: 'Elevate for Humanity Career & Training Institute' },
      { label: 'Registration Status', value: 'Registered (OA)' },
      { label: 'Registration Date', value: 'January 14, 2025' },
      { label: 'Oversight Agency', value: 'U.S. Department of Labor — Office of Apprenticeship' },
      { label: 'Assigned ATR', value: 'George D. Hutchinson, U.S. DOL' },
    ],
  },
  {
    category: 'Entity Information',
    items: [
      { label: 'Legal Entity', value: '2Exclusive LLC-S' },
      { label: 'EIN', value: '88-2609728' },
      { label: 'SAM UEI', value: '[Pending — provide your UEI to update]' },
      { label: 'Sponsor Type', value: 'Single Employer' },
      { label: 'NAICS', value: '[Pending — provide NAICS code to update]' },
      { label: 'Location', value: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240 (Marion County)' },
    ],
  },
  {
    category: 'RTI Provider Registrations',
    items: [
      { label: 'Provider ID (Sponsor)', value: '206251 — 2Exclusive LLC-S' },
      { label: 'Provider ID (Institute)', value: '208029 — Elevate for Humanity Career & Training Institute' },
      { label: 'Instruction Methods', value: 'Classroom, Correspondence/Shop, Web-Based Learning' },
    ],
  },
  {
    category: 'Registered Occupations',
    items: [
      { label: 'Building Services Technician', value: '432 RTI hours — Provider 206251' },
      { label: 'Hair Stylist', value: '154 RTI hours — Provider 206251' },
      { label: 'Barber', value: '260 RTI hours — Provider 208029' },
      { label: 'Esthetician', value: '300 RTI hours — Provider 208029' },
      { label: 'Nail Tech', value: '200 RTI hours — Provider 208029' },
      { label: 'Youth Culinary', value: '144 RTI hours — Provider 208029' },
    ],
  },
  {
    category: 'State Workforce Alignment',
    items: [
      { label: 'ETPL Status', value: 'Listed on Indiana INTraining system under 2Exclusive LLC-S' },
      { label: 'Workforce Region', value: 'Region 5 — Marion County, Indiana' },
      { label: 'WorkOne Alignment', value: 'Indianapolis WorkOne career center referral partner' },
      { label: 'Indiana PLA Compliance', value: 'Programs aligned with Indiana Professional Licensing Agency requirements for applicable occupations' },
    ],
  },
  {
    category: 'Licensing & Compliance Statements',
    items: [
      { label: 'Institutional Accreditation', value: 'Not applicable — programs are non-degree workforce training and registered apprenticeships' },
      { label: 'Federal Student Aid', value: 'Not offered — participants may access WIOA, JRI, WRG, employer sponsorship, or self-pay' },
      { label: 'Certification Issuance', value: 'Industry certifications issued by respective certifying bodies (EPA, OSHA, NRF, AHA, state boards) upon successful examination' },
      { label: 'Program Standards', value: 'Local Apprenticeship Standards (not based on National Guidelines)' },
    ],
  },
];

export default function VerificationApprovalsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Verification & Approvals' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          Verification &amp; Approvals
        </h1>
        <p className="text-base text-slate-600 mb-10 max-w-3xl">
          This page lists verifiable registrations, approvals, and compliance documentation for 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute. All items listed are factual and verifiable through the referenced agencies.
        </p>

        <div className="space-y-8">
          {verifications.map((section) => (
            <section key={section.category} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">{section.category}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {section.items.map((item) => (
                  <div key={item.label} className="px-5 py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <dt className="text-sm text-slate-500 sm:min-w-[220px] sm:max-w-[220px] flex-shrink-0">{item.label}</dt>
                    <dd className="text-sm font-medium text-slate-900">{item.value}</dd>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 bg-slate-50 border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Information on this page is provided for verification purposes by workforce partners, reviewing agencies, and authorized parties. Registration and approval status is subject to change based on agency review cycles. For the most current status, contact the referenced agency directly. This page does not constitute a claim of institutional accreditation.
          </p>
        </div>

        {/* Navigation */}
        <div className="border-t border-slate-200 pt-8 mt-8 flex flex-wrap gap-3">
          <Link href="/institutional-governance" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors">
            Institutional Governance
          </Link>
          <Link href="/compliance" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors">
            Compliance &amp; Security
          </Link>
        </div>
      </div>
    </div>
  );
}
