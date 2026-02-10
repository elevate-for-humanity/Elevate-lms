import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_EMPLOYERS } from '@/lib/demo/sandbox-data';

export default function DemoPartnersPage() {
  return (
    <DemoPageShell title="Partners" description="Employer and community partner management">
      <div className="space-y-3">
        {DEMO_EMPLOYERS.map((e) => (
          <div key={e.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">{e.name}</h3>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                {e.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
              <p>Contact: {e.contact}</p>
              <p>Type: {e.type}</p>
              <p>Apprentices: {e.apprentices}</p>
              <p>{e.address}</p>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
