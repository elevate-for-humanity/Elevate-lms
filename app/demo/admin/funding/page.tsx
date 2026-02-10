import { DemoPageShell } from '@/components/demo/DemoPageShell';

export default function DemoFundingPage() {
  return (
    <DemoPageShell title="Funding Management" description="Grant funding allocation and expenditure tracking">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-bold text-gray-900 mb-2">WIOA Adult Grant</h3>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Allocated</span>
              <span className="font-medium">$150,000</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Spent</span>
              <span className="font-medium text-blue-600">$98,500</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '66%' }} />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-bold text-gray-900 mb-2">Workforce Readiness Grant</h3>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Allocated</span>
              <span className="font-medium">$200,000</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Spent</span>
              <span className="font-medium text-blue-600">$189,000</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '95%' }} />
            </div>
          </div>
        </div>
      </div>
    </DemoPageShell>
  );
}
