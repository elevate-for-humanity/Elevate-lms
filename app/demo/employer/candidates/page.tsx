import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { Star } from 'lucide-react';

const candidates = [
  { name: 'Lisa Thompson', program: 'CNA Training', completion: '100%', credentials: ['CNA Certification', 'CPR/BLS'], available: 'Immediately', match: 95 },
  { name: 'Robert Kim', program: 'CDL Commercial Driving', completion: '100%', credentials: ['CDL Class A', 'HAZMAT'], available: 'Immediately', match: 92 },
  { name: 'Angela Davis', program: 'Medical Assistant', completion: '95%', credentials: ['CCMA (pending)'], available: '2 weeks', match: 88 },
  { name: 'Carlos Rivera', program: 'HVAC Technician', completion: '100%', credentials: ['EPA 608', 'OSHA 10'], available: 'Immediately', match: 85 },
  { name: 'Tanya Mitchell', program: 'Phlebotomy', completion: '100%', credentials: ['CPT Certification'], available: 'Immediately', match: 82 },
  { name: 'Derek Washington', program: 'Welding', completion: '88%', credentials: ['AWS D1.1 (in progress)'], available: '4 weeks', match: 78 },
];

export default function DemoCandidatesPage() {
  return (
    <DemoPageShell title="Candidates" description="Pre-screened candidates from training programs ready for hire." portal="employer">
      <div className="space-y-4">
        {candidates.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border p-5 hover:shadow-sm transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-500">{c.program} · {c.completion} complete</div>
              </div>
              <div className="flex items-center gap-1 bg-brand-green-50 text-brand-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                <Star className="w-3 h-3" /> {c.match}% match
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {c.credentials.map((cr) => (
                <span key={cr} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  <span className="text-slate-400 flex-shrink-0">•</span> {cr}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Available: {c.available}</span>
              <button className="text-xs bg-brand-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-blue-700">
                Request Interview
              </button>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
