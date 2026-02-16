import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { AlertTriangle, XCircle } from 'lucide-react';

const checks = [
  { area: 'WIOA Eligibility Documentation', status: 'pass', detail: '247/247 students have verified eligibility' },
  { area: 'FERPA Consent Forms', status: 'pass', detail: '245/247 signed — 2 pending' },
  { area: 'Background Check Clearance', status: 'warning', detail: '3 students awaiting results' },
  { area: 'Drug Screening (where required)', status: 'pass', detail: '89/89 CDL students cleared' },
  { area: 'Attendance Compliance (80% min)', status: 'warning', detail: '12 students below threshold' },
  { area: 'Instructor Certifications', status: 'pass', detail: 'All 18 instructors current' },
  { area: 'ADA Accommodations Documented', status: 'pass', detail: '7 accommodations on file' },
  { area: 'PIRL Data Submission', status: 'fail', detail: 'Q4 2025 report overdue — due Jan 31' },
];

export default function DemoCompliancePage() {
  return (
    <DemoPageShell title="Compliance" description="Compliance status across WIOA, FERPA, and program requirements." portal="admin">
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
            {checks.map((c, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{c.area}</td>
                <td className="px-5 py-3">
                  {c.status === 'pass' && <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold"><span className="text-slate-400 flex-shrink-0">•</span> Pass</span>}
                  {c.status === 'warning' && <span className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold"><AlertTriangle className="w-4 h-4" /> Attention</span>}
                  {c.status === 'fail' && <span className="flex items-center gap-1.5 text-red-600 text-xs font-semibold"><XCircle className="w-4 h-4" /> Action Required</span>}
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
