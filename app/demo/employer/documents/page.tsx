import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { FileText, Download, CheckCircle, Clock } from 'lucide-react';

const docs = [
  { name: 'OJT Agreement — Marcus Johnson', type: 'Contract', signed: true, date: 'Jun 1, 2025' },
  { name: 'OJT Agreement — David Chen', type: 'Contract', signed: true, date: 'Sep 15, 2025' },
  { name: 'OJT Agreement — James Brown', type: 'Contract', signed: true, date: 'Mar 10, 2025' },
  { name: 'OJT Agreement — Aisha Patel', type: 'Contract', signed: false, date: 'Pending signature' },
  { name: 'Employer MOU — Elevate for Humanity', type: 'MOU', signed: true, date: 'Jan 5, 2025' },
  { name: 'WOTC Pre-Screening Form 8850', type: 'Tax Form', signed: true, date: 'Dec 18, 2025' },
  { name: 'Apprenticeship Standards', type: 'DOL Filing', signed: true, date: 'Feb 20, 2025' },
  { name: 'Wage Schedule — CDL Program', type: 'Schedule', signed: true, date: 'Jun 1, 2025' },
];

export default function DemoDocumentsPage() {
  return (
    <DemoPageShell title="Documents" description="Contracts, MOUs, and compliance documents." portal="employer">
      <div className="space-y-3">
        {docs.map((d, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                <div className="text-xs text-gray-500">{d.type} · {d.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {d.signed ? (
                <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Signed</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><Clock className="w-3.5 h-3.5" /> Awaiting</span>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600"><Download className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
