import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'At-Risk Students',
  description: 'Review enrolled students who need immediate follow-up.',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  return (
    <ProgramHolderWorkspaceView
      section="at-risk"
      studentQuery={typeof params.q === 'string' ? params.q : ''}
      studentStatus={typeof params.status === 'string' ? params.status : 'all'}
    />
  );
}
