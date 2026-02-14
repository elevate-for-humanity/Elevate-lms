import { DemoPageShell } from '@/components/demo/DemoPageShell';

export default function DemoWioaPage() {
  return (
    <DemoPageShell title="WIOA Eligibility" description="Workforce Innovation and Opportunity Act eligibility tracking">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-brand-blue-600">38</p>
            <p className="text-xs text-gray-500">WIOA Eligible</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">12</p>
            <p className="text-xs text-gray-500">Enrolled via WIOA</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">5</p>
            <p className="text-xs text-gray-500">Pending Review</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-bold text-gray-900 mb-3">Eligibility Criteria Tracking</h3>
          <div className="space-y-2 text-sm">
            {['Low Income', 'Public Assistance', 'Veterans', 'Displaced Workers', 'Youth (16-24)'].map((c) => (
              <div key={c} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-gray-900">{c}</span>
                <span className="text-gray-500">{Math.floor(Math.random() * 15 + 3)} participants</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoPageShell>
  );
}
