import { DemoPageShell } from '@/components/demo/DemoPageShell';

const candidates = [
  { name: 'Jordan Mitchell', program: 'Barber Apprenticeship', status: 'Interview', match: 92 },
  { name: 'Keisha Brown', program: 'Cosmetology', status: 'Applied', match: 87 },
  { name: 'Andre Wilson', program: 'HVAC Technician', status: 'Screening', match: 78 },
];

export default function DemoCandidatesPage() {
  return (
    <DemoPageShell title="Candidates" description="Candidate pipeline and matching">
      <div className="bg-white rounded-lg border divide-y">
        {candidates.map((c) => (
          <div key={c.name} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-500">{c.program}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-600 font-medium">{c.match}% match</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">{c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
