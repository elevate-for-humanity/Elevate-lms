
import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { FileText, Download } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DemoReportsPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('reports').select('*').limit(50);
const reports = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Reports" description="Generate and download compliance, enrollment, and outcome reports." portal="admin">
      <div className="space-y-3">

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/pages/demo-page-9.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
        {reports.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                <div className="text-xs text-gray-500">{r.period} · {r.format}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                r.status === 'Submitted' ? 'bg-brand-green-100 text-brand-green-800' :
                r.status === 'Overdue' ? 'bg-brand-red-100 text-brand-red-800' :
                r.status === 'Ready' ? 'bg-brand-blue-100 text-brand-blue-800' :
                'bg-gray-100 text-gray-600'
              }`}>{r.status}</span>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
