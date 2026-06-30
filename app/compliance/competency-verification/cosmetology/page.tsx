export const dynamic = 'force-static';
export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PrintButton } from './PrintButton';
import { COSMETOLOGY_SECTIONS } from './cosmetology-rubric-data';

export const metadata: Metadata = {
  title: 'Cosmetology Apprenticeship Competency Rubric | Compliance',
  description: 'DOL-registered cosmetology apprenticeship competency verification rubric for Indiana.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/cosmetology' },
};

const COMPLIANCE_PAGES = [
  { label: 'Apprenticeship Agreement', href: '/compliance/competency-verification/cosmetology/apprenticeship-agreement' },
  { label: 'OJT Hours Log', href: '/compliance/competency-verification/cosmetology/ojt-hours-log' },
  { label: 'Monthly OJT Evaluation', href: '/compliance/competency-verification/cosmetology/monthly-ojt-evaluation' },
  { label: 'Competency Scoring Sheet', href: '/compliance/competency-verification/cosmetology/scoring-sheet' },
  { label: 'Supervisor Verification', href: '/compliance/competency-verification/cosmetology/supervisor-verification' },
  { label: 'Final Sign-Off', href: '/compliance/competency-verification/cosmetology/final-signoff' },
];

export default function CosmetologyComplianceIndexPage() {
  const totalRTI = COSMETOLOGY_SECTIONS.flatMap(s => s.items).reduce((a, i) => a + i.rtiHours, 0);
  const totalOJT = COSMETOLOGY_SECTIONS.flatMap(s => s.items).reduce((a, i) => a + i.ojtHours, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4 print:hidden">
        <Breadcrumbs items={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'Competency Verification', href: '/compliance/competency-verification' },
          { label: 'Cosmetology' },
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-4 print:hidden flex justify-between items-center">
        <Link href="/compliance/competency-verification" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
        <PrintButton />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        <InstitutionalHeader
          documentType="Competency Rubric"
          title="Cosmetology Apprenticeship — Competency Verification Rubric"
          subtitle="Indiana DOL Registered Apprenticeship | Occupation: Cosmetologist (332.271-010)"
        />

        <div className="grid md:grid-cols-3 gap-4 my-6 print:hidden">
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{COSMETOLOGY_SECTIONS.length}</p>
            <p className="text-sm text-slate-600">Competency Sections</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{totalRTI}h</p>
            <p className="text-sm text-slate-600">RTI Hours</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{totalOJT}h</p>
            <p className="text-sm text-slate-600">OJT Hours</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 my-6 print:hidden">
          {COMPLIANCE_PAGES.map(p => (
            <Link key={p.href} href={p.href}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <span className="font-medium text-slate-900">{p.label}</span>
              <span className="text-purple-600 text-sm">Open →</span>
            </Link>
          ))}
        </div>

        {COSMETOLOGY_SECTIONS.map(section => (
          <div key={section.section} className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-1">
              Section {section.section}: {section.title}
            </h2>
            <p className="text-sm text-slate-600 mb-4">{section.description}</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-left">ID</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Competency</th>
                  <th className="border border-slate-300 px-3 py-2 text-center">RTI hrs</th>
                  <th className="border border-slate-300 px-3 py-2 text-center">OJT hrs</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Assessment</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map(item => (
                  <tr key={item.id} className="even:bg-slate-50">
                    <td className="border border-slate-300 px-3 py-2 font-mono text-xs">{item.id}</td>
                    <td className="border border-slate-300 px-3 py-2 font-medium">{item.competency}</td>
                    <td className="border border-slate-300 px-3 py-2 text-center">{item.rtiHours}</td>
                    <td className="border border-slate-300 px-3 py-2 text-center">{item.ojtHours}</td>
                    <td className="border border-slate-300 px-3 py-2 text-xs">{item.assessmentType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <DocumentFooter />
      </div>
    </div>
  );
}
