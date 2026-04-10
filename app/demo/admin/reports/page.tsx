import type { Metadata } from 'next';
import Image from 'next/image';
import { FileText, Download } from 'lucide-react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';

export const metadata: Metadata = {
  title: 'Reports | Admin Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_REPORTS = [
  { name: 'WIOA Title I Quarterly Report', period: 'Q1 2026', format: 'PDF', status: 'Ready' },
  { name: 'RAPIDS Apprenticeship Export', period: 'Q1 2026', format: 'CSV', status: 'Submitted' },
  { name: 'Enrollment & Completion Summary', period: 'Mar 2026', format: 'PDF', status: 'Ready' },
  { name: 'Employer MOU Status Report', period: 'Apr 2026', format: 'PDF', status: 'Ready' },
  { name: 'ITA Expenditure Report', period: 'Q4 2025', format: 'XLSX', status: 'Submitted' },
  { name: 'ETPL Performance Report', period: 'Annual 2025', format: 'PDF', status: 'Submitted' },
  { name: 'DOL Outcomes Report', period: 'Q3 2025', format: 'PDF', status: 'Overdue' },
];

export default function DemoReportsPage() {

  return (
    <DemoPageShell title="Reports" description="Generate and download compliance, enrollment, and outcome reports." portal="admin">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-9.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="space-y-3">
        {DEMO_REPORTS.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                <div className="text-xs text-gray-500">{r.period} · {r.format}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                r.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                r.status === 'Overdue'   ? 'bg-red-100 text-red-800' :
                r.status === 'Ready'     ? 'bg-blue-100 text-blue-800' :
                                           'bg-gray-100 text-gray-600'
              }`}>{r.status}</span>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" aria-label="Download">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
