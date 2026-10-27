import {NextRequest,NextResponse} from 'next/server';
import {apiRequireDevStudio} from '@/lib/devstudio/api-auth';
import {applyRateLimit} from '@/lib/api/withRateLimit';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const task = String(body.task ?? body.goal ?? '').trim();
  if (!task) return NextResponse.json({ error: 'task is required' }, { status: 400 });

  const {enqueueParisRepair} = await import('@/lib/ai/runtime/code-repair');
  // Persist ownership first. The signed workflow stages the patch with its
  // short-lived job token, so closing Studio cannot interrupt or lose the task.
  const repair = await enqueueParisRepair({actorId:auth.id,goal:task});
  if(!repair.id)return NextResponse.json({error:'Durable repair task could not be confirmed.'},{status:503});
  return NextResponse.json({repairId:repair.id,status:'queued',executed:false,
    summary:'PARIS saved the repair task. The repair workflow will stage the patch, run independent checks, publish to main, and verify production.'},{status:202});
}
