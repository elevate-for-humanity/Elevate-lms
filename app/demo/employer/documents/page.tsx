export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { FileText, Download, Clock } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoDocumentsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('documents').select('*').limit(50);
const docs = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Documents" description="Contracts, MOUs, and compliance documents." portal="employer">
      <div className="space-y-3">

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/pages/demo-page-13.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
        {docs.map((d, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                <div className="text-xs text-gray-500">{d.type} · {d.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {d.signed ? (
                <span className="flex items-center gap-1 text-brand-green-600 text-xs font-semibold"><span className="text-slate-400 flex-shrink-0">•</span> Signed</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><Clock className="w-3.5 h-3.5" /> Awaiting</span>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600"><Download className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
