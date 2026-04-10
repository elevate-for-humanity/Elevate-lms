import type { Metadata } from 'next';
import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_APPRENTICES } from '@/lib/demo/sandbox-data';

export const metadata: Metadata = {
  title: 'Apprenticeships | Employer Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_DATA = [
  { name: 'Marcus Johnson', program: 'Barber Apprenticeship', startDate: 'Jan 2026', hoursLogged: 680, hoursRequired: 2000, wage: '$12/hr', wageTarget: '$18/hr', mentor: 'James Carter' },
  { name: 'Destiny Williams', program: 'Nail Technician', startDate: 'Feb 2026', hoursLogged: 320, hoursRequired: 1500, wage: '$11/hr', wageTarget: '$16/hr', mentor: 'Sandra Lee' },
  { name: 'Jamal Carter', program: 'Barber Apprenticeship', startDate: 'Mar 2026', hoursLogged: 140, hoursRequired: 2000, wage: '$12/hr', wageTarget: '$18/hr', mentor: 'James Carter' },
];

export default function DemoApprenticeshipsPage() {

  return (
    <DemoPageShell title="Apprenticeships" description="Track apprentice hours, wage progression, and mentor assignments." portal="employer">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-11.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="space-y-4">
        {DEMO_DATA.map((a, i) => {
          const pct = Math.round((a.hoursLogged / a.hoursRequired) * 100);
          return (
            <div key={i} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{a.name}</div>
                  <div className="text-sm text-gray-500">{a.program} · Started {a.startDate}</div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-semibold">{pct}%</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mb-3 text-sm">
                <div><div className="text-xs text-gray-500">Hours</div><div className="font-medium text-gray-900">{a.hoursLogged.toLocaleString()} / {a.hoursRequired.toLocaleString()}</div></div>
                <div><div className="text-xs text-gray-500">Current → Target Wage</div><div className="font-medium text-gray-900">{a.wage} → {a.wageTarget}</div></div>
                <div><div className="text-xs text-gray-500">Mentor</div><div className="font-medium text-gray-900">{a.mentor}</div></div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </DemoPageShell>
  );
}
