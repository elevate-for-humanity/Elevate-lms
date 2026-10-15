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

  const {stageParisCodeRepair} = await import('@/lib/devstudio/paris-code-engineer');
  const {enqueueParisRepair} = await import('@/lib/ai/runtime/code-repair');
  const staged = await stageParisCodeRepair(task,undefined,auth.id);
  const payload = await staged.json();
  if (!staged.ok) return NextResponse.json(payload,{status:staged.status});
  const repair = await enqueueParisRepair({actorId:auth.id,goal:task,candidate:payload});
  return NextResponse.json({...payload,repairId:repair.id,status:'running',summary:'PARIS staged the patch and queued independent validation before main publication.'},{status:202});
}
