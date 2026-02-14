import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_STUDENTS, DEMO_PROGRAMS } from '@/lib/demo/sandbox-data';

export default function DemoEnrollmentsPage() {
  return (
    <DemoPageShell title="Enrollments" description="Active enrollments across all programs">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {DEMO_PROGRAMS.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border p-4">
            <h3 className="font-bold text-gray-900">{p.name}</h3>
            <p className="text-sm text-gray-500">{p.type} — {p.duration}</p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="text-brand-blue-600 font-medium">{p.enrolled} enrolled</span>
              <span className="text-gray-400">/ {p.capacity} capacity</span>
            </div>
          </div>
        ))}
      </div>
      <h2 className="font-bold text-gray-900 mb-3">Recent Enrollments</h2>
      <div className="bg-white rounded-lg border divide-y">
        {DEMO_STUDENTS.filter(s => s.status === 'active').map((s) => (
          <div key={s.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{s.full_name}</p>
              <p className="text-sm text-gray-500">{s.program}</p>
            </div>
            <p className="text-sm text-gray-500">Started {s.start_date}</p>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
