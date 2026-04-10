import type { Metadata } from 'next';
import Image from 'next/image';
import { Play, Lock } from 'lucide-react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_LEARNER_COURSES } from '@/lib/demo/sandbox-data';

export const metadata: Metadata = {
  title: 'Courses | Learner Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function DemoCoursesPage() {

  return (
    <DemoPageShell title="Courses" description="Your enrolled courses and module progress." portal="learner">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-16.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="space-y-4">
        {(DEMO_LEARNER_COURSES as any[]).map((c, i) => (
          <div key={i} className={`bg-white rounded-xl border p-5 ${c.status === 'Locked' ? 'opacity-60' : 'hover:shadow-sm'} transition`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {c.status === 'Completed'  && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                {c.status === 'In Progress' && <Play className="w-5 h-5 text-blue-500" />}
                {c.status === 'Locked'      && <Lock className="w-5 h-5 text-gray-400" />}
                <div>
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.completed}/{c.modules} modules · Grade: {c.grade}</div>
                </div>
              </div>
              {c.status !== 'Locked' && (
                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">
                  {c.status === 'Completed' ? 'Review' : 'Continue'}
                </button>
              )}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${c.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${c.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
