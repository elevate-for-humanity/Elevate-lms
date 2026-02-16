import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { CheckCircle, Play, Lock } from 'lucide-react';

const courses = [
  { name: 'CDL Pre-Trip Inspection', modules: 8, completed: 8, progress: 100, status: 'Completed', grade: 'A' },
  { name: 'CDL Road Skills', modules: 12, completed: 9, progress: 72, status: 'In Progress', grade: '—' },
  { name: 'HAZMAT Safety', modules: 6, completed: 3, progress: 45, status: 'In Progress', grade: '—' },
  { name: 'DOT Regulations', modules: 10, completed: 0, progress: 0, status: 'Locked', grade: '—' },
  { name: 'Air Brakes', modules: 5, completed: 0, progress: 0, status: 'Locked', grade: '—' },
];

export default function DemoCoursesPage() {
  return (
    <DemoPageShell title="Courses" description="Your enrolled courses and module progress." portal="learner">
      <div className="space-y-4">
        {courses.map((c, i) => (
          <div key={i} className={`bg-white rounded-xl border p-5 ${c.status === 'Locked' ? 'opacity-60' : 'hover:shadow-sm'} transition`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {c.status === 'Completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
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
              <div className={`h-full rounded-full ${c.progress === 100 ? 'bg-green-500' : 'bg-brand-blue-500'}`} style={{ width: `${c.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
