import { DemoPageShell } from '@/components/demo/DemoPageShell';

const documents = [
  { name: 'Apprenticeship Agreement — Marcus Johnson', type: 'Agreement', date: '2025-06-15' },
  { name: 'WOTC Certification — Aaliyah Thompson', type: 'Tax Credit', date: '2025-03-01' },
  { name: 'Training Plan — HVAC Program', type: 'Plan', date: '2024-09-01' },
  { name: 'Quarterly Progress Report Q4 2025', type: 'Report', date: '2025-12-31' },
];

export default function DemoDocumentsPage() {
  return (
    <DemoPageShell title="Documents" description="Agreements, certifications, and compliance documents">
      <div className="bg-white rounded-lg border divide-y">
        {documents.map((d) => (
          <div key={d.name} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{d.name}</p>
              <p className="text-sm text-gray-500">{d.type}</p>
            </div>
            <p className="text-sm text-gray-400">{d.date}</p>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
