import {NextRequest,NextResponse} from 'next/server';
import {prepareParisRepair,publishParisRepair,reportParisRepairFailure,tickParisCodeRepairs,diagnoseParisGitHubCredential} from '@/lib/ai/runtime/code-repair';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function POST(request:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const body=await request.json().catch(()=>({}));
 try{
  if(body.phase==='auth-diagnostic')return NextResponse.json(await diagnoseParisGitHubCredential(),{headers:{'Cache-Control':'no-store'}});
  if(body.phase==='tick')return NextResponse.json(await tickParisCodeRepairs());
  if(!/^[a-f0-9-]{36}$/.test(body.repairId??'')||!Number.isSafeInteger(body.runId))return NextResponse.json({error:'Repair and workflow run required'},{status:400});
  if(body.phase==='prepare')return NextResponse.json(await prepareParisRepair(body.repairId,body.runId));
  if(body.phase==='publish')return NextResponse.json(await publishParisRepair(body.repairId,body.runId));
  if(body.phase==='failure'){await reportParisRepairFailure(body.repairId,body.runId);return NextResponse.json({recorded:true});}
  return NextResponse.json({error:'Unsupported phase'},{status:400});
 }catch(error){
  const detail=error as {message?:unknown;code?:unknown}|null;
  const message=String(detail?.message??'');
  const errorCode=(/^PARIS_GITHUB_HTTP_[1-5][0-9]{2}$/.test(message)||message==='PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED')?message:/^[A-Z0-9]{5}$/.test(String(detail?.code??''))?'PARIS_DATABASE_'+detail!.code:'PARIS_REPAIR_PHASE_FAILED';
  console.error('[PARIS] repair phase failed',errorCode);
  return NextResponse.json({error:'PARIS repair phase failed; see the protected execution log.',errorCode},{status:502});
 }

}
