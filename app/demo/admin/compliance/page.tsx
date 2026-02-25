export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { AlertTriangle, XCircle } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoCompliancePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('compliance_audits').select('*').limit(50);
const checks = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Compliance" description="Compliance status across WIOA, FERPA, and program requirements." portal="admin">
      <div className="bg-white rounded-xl border overflow-hidden">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Compliance Area</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{c.area}</td>
                <td className="px-5 py-3">
                  {c.status === 'pass' && <span className="flex items-center gap-1.5 text-brand-green-600 text-xs font-semibold"><span className="text-slate-400 flex-shrink-0">•</span> Pass</span>}
                  {c.status === 'warning' && <span className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold"><AlertTriangle className="w-4 h-4" /> Attention</span>}
                  {c.status === 'fail' && <span className="flex items-center gap-1.5 text-brand-red-600 text-xs font-semibold"><XCircle className="w-4 h-4" /> Action Required</span>}
                </td>
                <td className="px-5 py-3 text-gray-600 text-xs">{c.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
