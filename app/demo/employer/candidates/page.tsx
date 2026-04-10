import type { Metadata } from 'next';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_CANDIDATES } from '@/lib/demo/sandbox-data';

export const metadata: Metadata = {
  title: 'Candidates | Employer Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function DemoCandidatesPage() {

  return (
    <DemoPageShell title="Candidates" description="Pre-screened candidates from training programs ready for hire." portal="employer">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-12.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="space-y-4">
        {(DEMO_CANDIDATES as any[]).map((c, i) => (
          <div key={i} className="bg-white rounded-xl border p-5 hover:shadow-sm transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-500">{c.program} · {c.completion} complete</div>
              </div>
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                <Star className="w-3 h-3" /> {c.match}% match
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {(c.credentials ?? []).map((cr: string) => (
                <span key={cr} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{cr}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Available: {c.available}</span>
              <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">Request Interview</button>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
