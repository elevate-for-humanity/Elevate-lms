export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PrintButton } from '../PrintButton';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Cosmetology Work-Based Learning Agreement',
  description: 'Indiana cosmetology work-based-learning agreement for supervised host-salon training. This page does not represent a federally registered apprenticeship.',
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
          documentType="Work-Based Learning Agreement"
          title="Cosmetology Work-Based Learning Agreement"
          subtitle="Indiana Cosmetology Training Pathway | Supervised Host-Salon Learning"
        />

        <section className="mt-6 space-y-6 text-sm text-slate-800">
          <p>This Work-Based Learning Agreement is entered into between <strong>{PLATFORM_DEFAULTS.orgName}</strong>, the <strong>Host Salon</strong>, and the <strong>Participant</strong> for supervised cosmetology training consistent with the participant&apos;s written enrollment plan and applicable Indiana licensing requirements. This agreement is not a federal RAPIDS apprenticeship agreement.</p>

          <div>
            <h2 className="font-bold text-base mb-2">1. Program Requirements</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Training length and instructional requirements: governed by the current Indiana licensing pathway and the participant&apos;s written enrollment plan</li>
              <li>Occupation: Cosmetologist — O*NET 39-5012.00</li>
              <li>Federal RAPIDS registration: <strong>not represented by this agreement</strong></li>
              <li>Wage terms, when the participant is employed by the host salon: governed by the employer agreement and applicable law</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">2. Sponsor Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide or coordinate the instruction documented in the participant&apos;s current enrollment plan</li>
              <li>Maintain attendance, skills, progress, and completion documentation required for the pathway</li>
              <li>Issue only completion records and credentials the institution is authorized to issue</li>
              <li>Maintain records for the period required by applicable law, licensing rules, contracts, and institutional policy</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">3. Host Salon Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide supervised cosmetology practice consistent with the participant&apos;s enrollment plan and applicable Indiana requirements</li>
              <li>Assign an appropriately licensed cosmetology supervisor as required by current law and the training arrangement</li>
              <li>Pay wages according to the written employment agreement and applicable law when the participant is employed by the host salon</li>
              <li>Complete required progress evaluations and submit them to Elevate</li>
              <li>Maintain workers&apos; compensation and general liability insurance</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">4. Apprentice Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Complete all assigned coursework, skills checks, and assessments in the written enrollment plan</li>
              <li>Maintain accurate supervised-training and attendance records</li>
              <li>Adhere to salon policies, safety requirements, and professional standards</li>
              <li>Notify Elevate of any change in training-site or employment status</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-base mb-2">5. Signatures</h2>
            <div className="grid grid-cols-2 gap-8 mt-4">
              {['Participant', 'Host Salon Supervisor', 'Elevate Representative', 'Date'].map(label => (
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
