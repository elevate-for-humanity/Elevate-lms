import { DemoPageShell } from '@/components/demo/DemoPageShell';

const apprentices = [
  { name: 'Marcus Johnson', program: 'CDL Commercial Driving', hoursLogged: 680, hoursRequired: 2000, wage: '$18.50', wageTarget: '$24.00', mentor: 'Tom Richards', startDate: 'Jun 2025' },
  { name: 'David Chen', program: 'HVAC Technician', hoursLogged: 420, hoursRequired: 2000, wage: '$16.00', wageTarget: '$22.00', mentor: 'Mike Santos', startDate: 'Sep 2025' },
  { name: 'James Brown', program: 'Welding', hoursLogged: 1200, hoursRequired: 2000, wage: '$20.00', wageTarget: '$26.00', mentor: 'Bill Carter', startDate: 'Mar 2025' },
  { name: 'Aisha Patel', program: 'Medical Assistant', hoursLogged: 150, hoursRequired: 1500, wage: '$15.00', wageTarget: '$19.00', mentor: 'Dr. Sarah Lee', startDate: 'Dec 2025' },
];

export default function DemoApprenticeshipsPage() {
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
