import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Enrolled Students | Program Holder',
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  return (
    <ProgramHolderWorkspaceView
      section="students"
      studentQuery={typeof params.q === 'string' ? params.q : ''}
      studentStatus={typeof params.status === 'string' ? params.status : 'all'}
    />
  );
}
