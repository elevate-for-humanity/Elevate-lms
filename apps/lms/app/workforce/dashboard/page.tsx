import { WorkforceOverview } from '@/components/workforce/WorkforceOverview';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Dashboard | Workforce Portal',
  robots: { index: false, follow: false },
};
export default async function WorkforceDashboardPage() {
  return <WorkforceOverview />;
}
