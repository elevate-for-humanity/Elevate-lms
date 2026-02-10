import { DemoPageShell } from '@/components/demo/DemoPageShell';

export default function DemoIncentivesPage() {
  return (
    <DemoPageShell title="Incentives" description="Tax credits and employer incentive tracking">
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-bold text-gray-900 mb-1">WOTC Tax Credits</h3>
          <p className="text-2xl font-bold text-green-600">$12,400</p>
          <p className="text-sm text-gray-500">Estimated annual savings</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-bold text-gray-900 mb-1">Apprenticeship Grant</h3>
          <p className="text-2xl font-bold text-blue-600">$8,000</p>
          <p className="text-sm text-gray-500">Per apprentice reimbursement</p>
        </div>
      </div>
    </DemoPageShell>
  );
}
