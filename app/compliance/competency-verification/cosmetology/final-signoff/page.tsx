export const dynamic = 'force-static';
export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PrintButton } from '../PrintButton';
import { COSMETOLOGY_SECTIONS } from '../cosmetology-rubric-data';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Cosmetology Apprenticeship Final Sign-Off',
  description: 'Final competency sign-off for Indiana cosmetology apprenticeship.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/cosmetology/final-signoff' },
};

export default function CosmetologyFinalSignoffPage() {
  const totalRTI = COSMETOLOGY_SECTIONS.flatMap(s => s.items).reduce((a, i) => a + i.rtiHours, 0);
  const totalOJT = COSMETOLOGY_SECTIONS.flatMap(s => s.items).reduce((a, i) => a + i.ojtHours, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4 print:hidden">
        <Breadcrumbs items={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'Cosmetology', href: '/compliance/competency-verification/cosmetology' },
          { label: 'Final Sign-Off' },
        ]} />
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-4 print:hidden flex justify-between">
        <Link href="/compliance/competency-verification/cosmetology" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
        <PrintButton />
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <InstitutionalHeader
          documentType="Final Sign-Off"
          title="Cosmetology Apprenticeship — Final Competency Sign-Off"
          subtitle="{PLATFORM_DEFAULTS.orgName} | RAPIDS ID: 2025-IN-132302 | Occupation: Cosmetologist (332.271-010)"
        />

        <div className="grid grid-cols-3 gap-4 my-4 text-sm">
          {['Apprentice Name', 'Host Salon', 'Completion Date'].map(label => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <div className="border-b border-slate-400 h-7" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 my-4 text-sm border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-700">2,000</p>
            <p className="text-xs text-slate-600">Total Program Hours Required</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-700">{totalRTI}h RTI</p>
            <p className="text-xs text-slate-600">Related Technical Instruction</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-700">{totalOJT}h OJT</p>
            <p className="text-xs text-slate-600">On-the-Job Training</p>
          </div>
        </div>

        {COSMETOLOGY_SECTIONS.map(section => (
          <div key={section.section} className="mb-5 break-inside-avoid">
            <h2 className="font-bold text-sm bg-slate-100 px-3 py-2 border border-slate-300">
              Section {section.section}: {section.title}
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-300 px-2 py-1 text-left">Competency</th>
                  <th className="border border-slate-300 px-2 py-1 text-center">Pass ☐</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Instructor Initials</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Supervisor Initials</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map(item => (
                  <tr key={item.id} className="h-8 even:bg-slate-50">
                    <td className="border border-slate-300 px-2">{item.competency}</td>
                    <td className="border border-slate-300 px-2 text-center">☐</td>
                    <td className="border border-slate-300 px-2" />
                    <td className="border border-slate-300 px-2" />
                    <td className="border border-slate-300 px-2" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm">
          <p className="font-bold mb-1">Program Completion Declaration</p>
          <p className="text-xs text-slate-700">We certify that the above apprentice has successfully completed all competency requirements of the Indiana DOL Registered Cosmetology Apprenticeship program and is eligible for program completion certificate issuance and state board examination.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6 text-sm">
          {['RTI Instructor Signature', 'OJT Supervisor Signature', 'Program Sponsor Representative', 'Date of Completion'].map(label => (
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
