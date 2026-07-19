export const dynamic = 'force-static';
export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'Cosmetology Monthly OJT Evaluation',
  description: 'Monthly supervisor evaluation form for Indiana cosmetology apprenticeship.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/cosmetology/monthly-ojt-evaluation' },
};

const CATEGORIES = [
  { id: 'technical', label: 'Technical Skills', items: ['Hair cutting accuracy', 'Chemical service execution', 'Skin/nail service quality', 'Tool and equipment handling'] },
  { id: 'sanitation', label: 'Sanitation & Safety', items: ['Tool disinfection compliance', 'Station setup/breakdown', 'PPE usage', 'State board standards adherence'] },
  { id: 'client', label: 'Client Relations', items: ['Consultation quality', 'Communication and professionalism', 'Handling client concerns', 'Retail recommendations'] },
  { id: 'professional', label: 'Professional Conduct', items: ['Punctuality and attendance', 'Salon policy compliance', 'Team collaboration', 'Initiative and attitude'] },
];

const RATINGS = ['4 — Exceeds', '3 — Meets', '2 — Developing', '1 — Below'];

export default function CosmetologyMonthlyOjtEvaluationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 print:hidden">
        <Breadcrumbs items={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'Cosmetology', href: '/compliance/competency-verification/cosmetology' },
          { label: 'Monthly OJT Evaluation' },
        ]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-4 print:hidden flex justify-between">
        <Link href="/compliance/competency-verification/cosmetology" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
        <PrintButton />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <InstitutionalHeader
          documentType="Monthly OJT Evaluation"
          title="Cosmetology Apprenticeship — Monthly Supervisor Evaluation"
          subtitle="Complete monthly. Submit to Program Sponsor by the 5th of the following month."
        />

        <div className="grid grid-cols-3 gap-4 my-4 text-sm">
          {['Apprentice Name', 'Host Salon', 'Evaluation Month'].map(label => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <div className="border-b border-slate-400 h-7" />
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-600 mb-4">Rating scale: 4 = Exceeds · 3 = Meets · 2 = Developing · 1 = Below expectations</p>

        {CATEGORIES.map(cat => (
          <div key={cat.id} className="mb-6">
            <h2 className="font-bold text-sm bg-slate-100 px-3 py-2 border border-slate-300">{cat.label}</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-300 px-3 py-1 text-left w-1/2">Competency</th>
                  {RATINGS.map(r => <th key={r} className="border border-slate-300 px-2 py-1 text-center">{r}</th>)}
                  <th className="border border-slate-300 px-2 py-1 text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map(item => (
                  <tr key={item} className="h-8">
                    <td className="border border-slate-300 px-3 py-1">{item}</td>
                    {RATINGS.map(r => <td key={r} className="border border-slate-300 px-2 text-center">☐</td>)}
                    <td className="border border-slate-300 px-2" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-4">
          <p className="text-xs font-bold mb-1">Supervisor Comments</p>
          <div className="border border-slate-300 h-20 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6 text-sm">
          {['Supervisor Signature', 'Apprentice Signature', 'Date', 'OJT Hours This Month'].map(label => (
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
