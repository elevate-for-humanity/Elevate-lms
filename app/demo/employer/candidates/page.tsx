export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { Star } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoCandidatesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('applications').select('*').limit(50);
const candidates = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Candidates" description="Pre-screened candidates from training programs ready for hire." portal="employer">
      <div className="space-y-4">

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/pages/demo-page-12.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
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
