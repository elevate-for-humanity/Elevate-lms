import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DollarSign, Clock } from 'lucide-react';

const incentives = [
  { type: 'OJT Reimbursement', apprentice: 'Marcus Johnson', amount: '$4,625', status: 'Paid', date: 'Jan 15, 2026' },
  { type: 'OJT Reimbursement', apprentice: 'James Brown', amount: '$6,000', status: 'Paid', date: 'Jan 10, 2026' },
  { type: 'WOTC Tax Credit', apprentice: 'David Chen', amount: '$2,400', status: 'Approved', date: 'Dec 20, 2025' },
  { type: 'OJT Reimbursement', apprentice: 'David Chen', amount: '$2,100', status: 'Pending', date: 'Feb 1, 2026' },
  { type: 'WOTC Tax Credit', apprentice: 'Aisha Patel', amount: '$2,400', status: 'Submitted', date: 'Jan 28, 2026' },
  { type: 'Apprenticeship Completion Bonus', apprentice: 'James Brown', amount: '$1,500', status: 'Pending', date: 'Est. Apr 2026' },
];

export default function DemoIncentivesPage() {
  return (
    <DemoPageShell title="Incentives" description="OJT reimbursements, WOTC tax credits, and hiring incentives." portal="employer">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-brand-green-600" /><span className="text-xs text-gray-500">Total Earned</span></div>
          <div className="text-2xl font-bold text-gray-900">$18,425</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-slate-400 flex-shrink-0">•</span><span className="text-xs text-gray-500">Paid Out</span></div>
          <div className="text-2xl font-bold text-gray-900">$13,025</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-gray-500">Pending</span></div>
          <div className="text-2xl font-bold text-gray-900">$5,400</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Apprentice</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {incentives.map((inc, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{inc.type}</td>
                <td className="px-5 py-3 text-gray-600">{inc.apprentice}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">{inc.amount}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    inc.status === 'Paid' ? 'bg-brand-green-100 text-brand-green-800' :
                    inc.status === 'Approved' ? 'bg-brand-blue-100 text-brand-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>{inc.status}</span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{inc.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
