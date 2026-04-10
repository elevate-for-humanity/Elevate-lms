import type { Metadata } from 'next';
import Image from 'next/image';
import { FileText, Download, Clock } from 'lucide-react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';

export const metadata: Metadata = {
  title: 'Documents | Employer Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_DOCS = [
  { name: 'Employer MOU — Downtown Barber Shop', type: 'MOU', date: 'Jan 15, 2026', signed: true },
  { name: 'OJT Reimbursement Agreement', type: 'Contract', date: 'Jan 15, 2026', signed: true },
  { name: 'WOTC Certification — Marcus Johnson', type: 'Tax Form', date: 'Feb 3, 2026', signed: true },
  { name: 'Apprenticeship Standards — Barber', type: 'DOL Filing', date: 'Dec 1, 2025', signed: true },
  { name: 'Employer MOU — Mesmerized by Beauty', type: 'MOU', date: 'Apr 2026', signed: false },
  { name: 'Q1 2026 Wage Verification', type: 'Compliance', date: 'Apr 1, 2026', signed: false },
];

export default function DemoDocumentsPage() {

  return (
    <DemoPageShell title="Documents" description="Contracts, MOUs, and compliance documents." portal="employer">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-13.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="space-y-3">
        {DEMO_DOCS.map((d, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                <div className="text-xs text-gray-500">{d.type} · {d.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {d.signed
                ? <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Signed</span>
                : <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><Clock className="w-3.5 h-3.5" /> Awaiting</span>}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" aria-label="Download"><Download className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
