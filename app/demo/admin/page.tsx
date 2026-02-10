import AdminDemoClient from './AdminDemoClient';
import {
  DEMO_STUDENTS,
  DEMO_PROGRAMS,
  DEMO_METRICS,
  DEMO_RECENT_ACTIVITY,
} from '@/lib/demo/sandbox-data';

export default function DemoAdminPage() {
  return (
    <AdminDemoClient
      stats={{
        students: DEMO_METRICS.totalStudents,
        programs: DEMO_PROGRAMS.length,
        activeEnrollments: DEMO_METRICS.activeEnrollments,
        partners: DEMO_METRICS.employerPartners,
      }}
      students={DEMO_STUDENTS.map((s) => ({
        id: s.id,
        name: s.full_name,
        email: s.email,
        program: s.program,
        progress: s.hours_required
          ? Math.round((s.hours_completed / s.hours_required) * 100)
          : 100,
        status: s.status,
        avatar: '/images/avatar-placeholder.png',
      }))}
      programs={DEMO_PROGRAMS.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.type === 'apprenticeship' ? 'Trades' : 'Healthcare',
        enrolled: p.enrolled,
        completed: Math.round(p.enrolled * 0.6),
      }))}
      activity={DEMO_RECENT_ACTIVITY.map((a) => ({
        msg: a.message,
        time: new Date(a.timestamp).toLocaleDateString(),
        type: a.type,
      }))}
    />
  );
}
