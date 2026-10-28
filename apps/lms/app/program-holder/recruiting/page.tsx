import { redirect } from 'next/navigation';
import { getProgramHolderWorkspace } from '@/lib/program-holder/workspace';
import { hasRecruitingAssignment } from '@/lib/program-holder/recruiting-access';
import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
export const dynamic = 'force-dynamic';
export default async function RecruitingPage() {
  const data = await getProgramHolderWorkspace();
  if (data.mode !== 'holder' || !hasRecruitingAssignment(data.holder?.features))
    redirect('/unauthorized');
  return <ProgramHolderWorkspaceView workspace={data} section="recruiting" />;
}
