import { DemoPageShell } from '@/components/demo/DemoPageShell';

const complianceItems = [
  { name: 'WIOA Quarterly Report', status: 'Due Jan 31', severity: 'warning' },
  { name: 'Student Hour Verification', status: 'Current', severity: 'ok' },
  { name: 'Employer Partner Agreements', status: 'Current', severity: 'ok' },
  { name: 'FERPA Compliance Audit', status: 'Scheduled Feb 15', severity: 'info' },
  { name: 'Grant Expenditure Report', status: 'Current', severity: 'ok' },
];

export default function DemoCompliancePage() {
  return (
    <DemoPageShell title="Compliance" description="Regulatory compliance tracking and reporting">
      <div className="space-y-3">
        {complianceItems.map((item) => (
          <div key={item.name} className="bg-white rounded-lg border p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-500">{item.status}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              item.severity === 'ok' ? 'bg-green-100 text-green-700' :
              item.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
              'bg-brand-blue-100 text-brand-blue-700'
            }`}>
              {item.severity === 'ok' ? 'Current' : item.severity === 'warning' ? 'Action Needed' : 'Scheduled'}
            </span>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
