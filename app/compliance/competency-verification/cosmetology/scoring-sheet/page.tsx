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
  title: 'Cosmetology Apprenticeship Scoring Sheet',
  description: 'Competency scoring sheet for Indiana cosmetology apprenticeship.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/cosmetology/scoring-sheet' },
};

export default function CosmetologyScoringSheetPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4 print:hidden">
        <Breadcrumbs items={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'Cosmetology', href: '/compliance/competency-verification/cosmetology' },
          { label: 'Scoring Sheet' },
        ]} />
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-4 print:hidden flex justify-between">
        <Link href="/compliance/competency-verification/cosmetology" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
        <PrintButton />
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <InstitutionalHeader
          documentType="Competency Scoring Sheet"
          title="Cosmetology Apprenticeship — Competency Scoring Sheet"
          subtitle={`${PLATFORM_DEFAULTS.orgName} | RAPIDS ID: 2025-IN-132302 | Occupation: Cosmetologist (332.271-010)`}
        />

        <div className="grid grid-cols-3 gap-4 my-4 text-sm">
          {['Apprentice Name', 'Host Salon', 'Assessment Date'].map(label => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <div className="border-b border-slate-400 h-7" />
            </div>
          ))}
        </div>

        {COSMETOLOGY_SECTIONS.map(section => (
          <div key={section.section} className="mb-6 break-inside-avoid">
            <h2 className="font-bold text-sm bg-slate-100 px-3 py-2 border border-slate-300">
              Section {section.section}: {section.title}
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-300 px-2 py-1 text-left">ID</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Competency</th>
                  <th className="border border-slate-300 px-2 py-1 text-center">RTI</th>
                  <th className="border border-slate-300 px-2 py-1 text-center">OJT</th>
                  <th className="border border-slate-300 px-2 py-1 text-center">Pass ☐</th>
                  <th className="border border-slate-300 px-2 py-1 text-center">Remediation ☐</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Evaluator</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map(item => (
                  <tr key={item.id} className="h-8 even:bg-slate-50">
                    <td className="border border-slate-300 px-2 font-mono">{item.id}</td>
                    <td className="border border-slate-300 px-2">{item.competency}</td>
                    <td className="border border-slate-300 px-2 text-center">{item.rtiHours}h</td>
                    <td className="border border-slate-300 px-2 text-center">{item.ojtHours}h</td>
                    <td className="border border-slate-300 px-2 text-center">☐</td>
                    <td className="border border-slate-300 px-2 text-center">☐</td>
                    <td className="border border-slate-300 px-2" />
                    <td className="border border-slate-300 px-2" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-8 mt-6 text-sm">
          {['Evaluator Signature', 'Apprentice Signature', 'Date Completed', 'Total Hours Verified'].map(label => (
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
