import { WorkforceRoster } from '@/components/workforce/WorkforceRoster';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Participants | Workforce Portal',
  robots: { index: false, follow: false },
};
export default async function WorkforceParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  return <WorkforceRoster params={await searchParams} />;
}
