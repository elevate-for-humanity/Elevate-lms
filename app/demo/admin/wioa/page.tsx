export const dynamic = 'force-dynamic';

import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { Clock, AlertTriangle } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoWioaPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('wioa_participants').select('*').limit(50);
const participants = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="WIOA" description="WIOA eligibility, Individual Training Accounts, and participant tracking." portal="admin">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">182</div>
          <div className="text-xs text-gray-500">WIOA Participants</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">$847K</div>
          <div className="text-xs text-gray-500">ITA Funds Obligated</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">94%</div>
          <div className="text-xs text-gray-500">Eligibility Verified</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Participant</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Barriers</th>
              <th className="px-5 py-3 font-medium">ITA</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-gray-600">{p.title}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.barriers.map((b) => (
                      <span key={b} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{b}</span>
                    ))}
                    {p.barriers.length === 0 && <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{p.ita}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1">
                    {p.status === 'Active' && <span className="text-slate-400 flex-shrink-0">•</span>}
                    {p.status === 'Pending Docs' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {p.status === 'Ineligible' && <AlertTriangle className="w-3.5 h-3.5 text-brand-red-500" />}
                    <span className="text-xs">{p.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
