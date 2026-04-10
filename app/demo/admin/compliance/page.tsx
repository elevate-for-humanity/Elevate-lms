import type { Metadata } from 'next';
import Image from 'next/image';
import { AlertTriangle, XCircle } from 'lucide-react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';

export const metadata: Metadata = {
  title: 'Compliance | Admin Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_CHECKS = [
  { area: 'WIOA Title I Eligibility', status: 'pass', detail: 'All 12 active participants verified' },
  { area: 'FERPA Data Handling', status: 'pass', detail: 'No unauthorized disclosures on file' },
  { area: 'DOL RAPIDS Reporting', status: 'warning', detail: 'Q1 2026 export due Apr 15 — not yet submitted' },
  { area: 'MOU Signatures', status: 'warning', detail: '2 employer MOUs pending signature' },
  { area: 'Attendance Documentation', status: 'pass', detail: 'GPS-verified timeclock records complete' },
  { area: 'Indiana Apprenticeship Standards', status: 'pass', detail: 'All programs registered with IDOL' },
  { area: 'ETPL Certification', status: 'pass', detail: 'Current through Dec 2026' },
  { area: 'Background Check Compliance', status: 'fail', detail: '1 participant — check expired, renewal required' },
];

export default function DemoCompliancePage() {

  return (
    <DemoPageShell title="Compliance" description="Compliance status across WIOA, FERPA, and program requirements." portal="admin">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-3.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Compliance Area</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_CHECKS.map((c, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{c.area}</td>
                <td className="px-5 py-3">
                  {c.status === 'pass' && <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Pass</span>}
                  {c.status === 'warning' && <span className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Attention</span>}
                  {c.status === 'fail' && <span className="flex items-center gap-1.5 text-red-600 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> Action Required</span>}
                </td>
                <td className="px-5 py-3 text-gray-600 text-xs">{c.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
