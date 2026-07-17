export const dynamic = 'force-static';
export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'Supervisor Verification Form — Cosmetology Apprenticeship',
  description: 'Supervisor verification form for Indiana cosmetology apprenticeship.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/cosmetology/supervisor-verification' },
};

const VERIFICATIONS = [
  'Apprentice has completed all required OJT hours (1,500 minimum)',
  'All monthly OJT evaluations have been submitted to Program Sponsor',
  'Apprentice has demonstrated all competencies in the scoring rubric',
  'Apprentice has maintained professional conduct throughout the program',
  'Apprentice is ready to sit for the Indiana State Board examination',
  'All required compliance documents have been submitted',
  'No outstanding remediation requirements remain',
];

export default function CosmetologySupervisorVerificationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 print:hidden">
        <Breadcrumbs items={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'Cosmetology', href: '/compliance/competency-verification/cosmetology' },
          { label: 'Supervisor Verification' },
        ]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-4 print:hidden flex justify-between">
        <Link href="/compliance/competency-verification/cosmetology" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
        <PrintButton />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <InstitutionalHeader
          documentType="Supervisor Verification"
          title="Supervisor Verification Form — Cosmetology Apprenticeship"
          subtitle="To be completed by the licensed cosmetology supervisor at program completion."
        />

        <div className="grid grid-cols-2 gap-4 my-4 text-sm">
          {['Apprentice Name', 'Host Salon Name', 'Supervisor Name', 'Supervisor License Number', 'Program Start Date', 'Program End Date'].map(label => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <div className="border-b border-slate-400 h-7" />
            </div>
          ))}
        </div>

        <h2 className="font-bold text-sm mt-6 mb-3">Supervisor Attestations</h2>
        <p className="text-xs text-slate-600 mb-4">Check each item to confirm completion. All items must be checked before submitting.</p>

        <div className="space-y-3">
          {VERIFICATIONS.map((v, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg">
              <div className="w-5 h-5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-800">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
          <p className="font-bold mb-2">Supervisor Declaration</p>
          <p className="text-slate-700 text-xs">I, the undersigned licensed cosmetologist, attest that the above apprentice has satisfactorily completed all requirements of the Indiana DOL Registered Cosmetology Apprenticeship program and is prepared to sit for the Indiana State Board examination.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6 text-sm">
          {['Supervisor Signature', 'Date', 'Program Sponsor Representative', 'Date'].map(label => (
            <div key={label}>
              <div className="border-b border-slate-400 h-8 mb-1" />
              <p className="text-xs text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <DocumentFooter />
      </div>
    </div>
  );
}
