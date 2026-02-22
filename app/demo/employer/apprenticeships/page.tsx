export const dynamic = 'force-dynamic';

import { DemoPageShell } from '@/components/demo/DemoPageShell';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoApprenticeshipsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('apprenticeships').select('*').limit(50);
const apprentices = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Apprenticeships" description="Track apprentice hours, wage progression, and mentor assignments." portal="employer">
      <div className="space-y-4">
        {apprentices.map((a, i) => {
          const pct = Math.round((a.hoursLogged / a.hoursRequired) * 100);
          return (
            <div key={i} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{a.name}</div>
                  <div className="text-sm text-gray-500">{a.program} · Started {a.startDate}</div>
                </div>
                <span className="text-xs bg-brand-blue-100 text-brand-blue-800 px-2.5 py-1 rounded-full font-semibold">{pct}%</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Hours</div>
                  <div className="font-medium text-gray-900">{a.hoursLogged.toLocaleString()} / {a.hoursRequired.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Current → Target Wage</div>
                  <div className="font-medium text-gray-900">{a.wage} → {a.wageTarget}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Mentor</div>
                  <div className="font-medium text-gray-900">{a.mentor}</div>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </DemoPageShell>
  );
}
