export const dynamic = 'force-static';
export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { DocumentFooter } from '@/components/documents/DocumentFooter';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'Cosmetology OJT Hours Log',
  description: 'On-the-job training hours log for Indiana cosmetology apprenticeship.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/cosmetology/ojt-hours-log' },
};

const rows = Array.from({ length: 25 }, (_, i) => i);

export default function CosmetologyOjtHoursLogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 print:hidden">
        <Breadcrumbs items={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'Cosmetology', href: '/compliance/competency-verification/cosmetology' },
          { label: 'OJT Hours Log' },
        ]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-4 print:hidden flex justify-between">
        <Link href="/compliance/competency-verification/cosmetology" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
        <PrintButton />
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <InstitutionalHeader
          documentType="OJT Hours Log"
          title="Cosmetology Apprenticeship — OJT Hours Log"
          subtitle="Complete one log per month. Submit to Program Sponsor by the 5th of the following month."
        />

        <div className="grid grid-cols-3 gap-4 my-4 text-sm">
          {['Apprentice Name', 'Host Salon', 'Month / Year'].map(label => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <div className="border-b border-slate-400 h-7" />
            </div>
          ))}
        </div>

        <table className="w-full text-xs border-collapse mt-4">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-2 py-2 text-left">Date</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Service / Task Performed</th>
              <th className="border border-slate-300 px-2 py-2 text-center">Start</th>
              <th className="border border-slate-300 px-2 py-2 text-center">End</th>
              <th className="border border-slate-300 px-2 py-2 text-center">Hours</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Supervisor Initials</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(i => (
              <tr key={i} className="h-8">
                <td className="border border-slate-300 px-2" />
                <td className="border border-slate-300 px-2" />
                <td className="border border-slate-300 px-2" />
                <td className="border border-slate-300 px-2" />
                <td className="border border-slate-300 px-2" />
                <td className="border border-slate-300 px-2" />
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-slate-300 px-2 py-2 text-right">Monthly Total Hours:</td>
              <td className="border border-slate-300 px-2 py-2 text-center" />
              <td className="border border-slate-300 px-2 py-2" />
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 mt-6 text-sm">
          {['Apprentice Signature', 'Supervisor Signature', 'Date Submitted', 'Cumulative OJT Hours to Date'].map(label => (
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
