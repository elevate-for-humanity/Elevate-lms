import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const params = await searchParams;
  return (
    <ProgramHolderWorkspaceView
      section="reports"
      reportEnrollmentId={typeof params.student === 'string' ? params.student : ''}
    />
  );
}
