import Image from 'next/image';
import AdminDemoClient from './AdminDemoClient';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import {
  DEMO_STUDENTS,
  DEMO_PROGRAMS,
  DEMO_METRICS,
  DEMO_RECENT_ACTIVITY,
} from '@/lib/demo/sandbox-data';

export default function DemoAdminPage() {
  return (
    <DemoPageShell
      title="Dashboard"
      description="Overview of enrollment, outcomes, and compliance across all programs."
      portal="admin"
    >

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/pages/demo-page-7.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <AdminDemoClient
        students={DEMO_STUDENTS}
        programs={DEMO_PROGRAMS}
        metrics={DEMO_METRICS}
        recentActivity={DEMO_RECENT_ACTIVITY}
      />
    </DemoPageShell>
  );
}
