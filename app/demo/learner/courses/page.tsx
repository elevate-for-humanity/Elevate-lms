export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { Play, Lock } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DemoCoursesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('training_courses').select('*').limit(50);
const courses = (dbRows as any[]) || [];

  return (
    <DemoPageShell title="Courses" description="Your enrolled courses and module progress." portal="learner">
      <div className="space-y-4">

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
        {courses.map((c, i) => (
          <div key={i} className={`bg-white rounded-xl border p-5 ${c.status === 'Locked' ? 'opacity-60' : 'hover:shadow-sm'} transition`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {c.status === 'Completed' && <span className="text-slate-400 flex-shrink-0">•</span>}
                {c.status === 'In Progress' && <Play className="w-5 h-5 text-brand-blue-500" />}
                {c.status === 'Locked' && <Lock className="w-5 h-5 text-gray-400" />}
                <div>
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.completed}/{c.modules} modules · Grade: {c.grade}</div>
                </div>
              </div>
              {c.status !== 'Locked' && (
                <button className="text-xs bg-brand-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-blue-700">
                  {c.status === 'Completed' ? 'Review' : 'Continue'}
                </button>
              )}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${c.progress === 100 ? 'bg-brand-green-500' : 'bg-brand-blue-500'}`} style={{ width: `${c.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
