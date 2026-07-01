export const dynamic = 'force-static';
export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PrintButton } from '../PrintButton';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Cosmetology Apprenticeship Agreement',
  description: 'DOL-registered cosmetology apprenticeship agreement — Indiana.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/cosmetology/apprenticeship-agreement' },
};

export default function CosmetologyApprenticeshipAgreementPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 print:hidden">
        <Breadcrumbs items={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'Cosmetology', href: '/compliance/competency-verification/cosmetology' },
          { label: 'Apprenticeship Agreement' },
        ]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-4 print:hidden flex justify-between">
        <Link href="/compliance/competency-verification/cosmetology" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
        <PrintButton />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <InstitutionalHeader
          documentType="Apprenticeship Agreement"
          title="Cosmetology Apprenticeship Agreement"
          subtitle="Indiana DOL Registered Apprenticeship | Occupation: Cosmetologist (332.271-010)"
        />

        <section className="mt-6 space-y-6 text-sm text-slate-800">
          <p>This Apprenticeship Agreement is entered into between <strong>{PLATFORM_DEFAULTS.orgName}</strong> (Program Sponsor), the <strong>Host Salon</strong> (Training Agent), and the <strong>Apprentice</strong>, in accordance with the National Apprenticeship Act and Indiana apprenticeship standards.</p>

          <div>
            <h2 className="font-bold text-base mb-2">1. Program Requirements</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Total program length: <strong>2,000 hours</strong> (1,500 OJT + 500 RTI)</li>
              <li>Occupation: Cosmetologist — O*NET 39-5012.00</li>
              <li>RAPIDS Occupation Code: 332.271-010</li>
              <li>Wage progression: per Indiana prevailing wage schedule</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">2. Sponsor Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide 500 hours of Related Technical Instruction (RTI)</li>
              <li>Register apprentice with Indiana RAPIDS system</li>
              <li>Issue completion certificate upon successful program completion</li>
              <li>Maintain all required DOL records for 5 years</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">3. Host Salon Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide 1,500 hours of supervised OJT</li>
              <li>Assign a licensed cosmetologist supervisor (minimum 2 years licensed)</li>
              <li>Pay apprentice wages per agreed wage schedule</li>
              <li>Complete monthly OJT evaluations and submit to sponsor</li>
              <li>Maintain workers&apos; compensation and general liability insurance</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">4. Apprentice Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Complete all RTI coursework with 70% or higher passing score</li>
              <li>Maintain accurate OJT hours log</li>
              <li>Adhere to salon policies and professional standards</li>
              <li>Notify sponsor of any change in employment status</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">5. Signatures</h2>
            <div className="grid grid-cols-2 gap-8 mt-4">
              {['Apprentice', 'Host Salon Supervisor', 'Program Sponsor Representative', 'Date'].map(label => (
                <div key={label}>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <p className="text-xs text-slate-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <DocumentFooter />
      </div>
    </div>
  );
}
