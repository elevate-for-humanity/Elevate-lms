import { WorkforceToolPage } from '@/components/workforce/WorkforceToolPage';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Eligibility | Workforce Portal',
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; saved?: string; error?: string }>;
}) {
  return <WorkforceToolPage tool="eligibility" params={await searchParams} />;
}
