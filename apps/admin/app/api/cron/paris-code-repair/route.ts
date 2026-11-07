import {withWorkflowGitHubToken} from '@/lib/devstudio/workflow-github-context';
import {classifyParisPhaseError} from '@/lib/devstudio/paris-phase-error.mjs';
import {getGitHubAppToken} from '@/lib/devstudio/github-app-token';
import {authorizeParisWorkflow,authorizeParisDeploymentAppDiagnostic} from '@/lib/paris-workflow-identity';
import {NextRequest,NextResponse} from 'next/server';
import {prepareParisRepair,publishParisRepair,reportParisRepairFailure,tickParisCodeRepairs,reportParisDispatchFailure,diagnoseParisGitHubCredential} from '@/lib/ai/runtime/code-repair';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function POST(request:NextRequest){
 const authorization=request.headers.get('authorization');
 const repairAuthority=await authorizeParisWorkflow(authorization);
 const deploymentDiagnosticOnly=!repairAuthority && await authorizeParisDeploymentAppDiagnostic(authorization);
 if(!repairAuthority && !deploymentDiagnosticOnly)return NextResponse.json({error:'Unauthorized'},{status:401});
 const body=await request.json().catch(()=>({}));
 if(deploymentDiagnosticOnly && !['app-auth-diagnostic','auth-diagnostic'].includes(body.phase))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  if(body.phase==='app-auth-diagnostic'){
   // Deliberately ignore X-Paris-GitHub-Token: this phase proves the runtime App.
   const token=await getGitHubAppToken();
   if(!token)return NextResponse.json({errorCode:'GITHUB_APP_NOT_CONFIGURED'},{status:503});
   const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
   return NextResponse.json({...await diagnoseParisGitHubCredential(headers),credentialSource:'github-app-installation',writeAuthority:'not_exercised'},{headers:{'Cache-Control':'no-store'}});
  }
  if(body.phase==='auth-diagnostic'){
   const diagnostic=async()=>NextResponse.json({...await diagnoseParisGitHubCredential(),workflowAuthorization:'temporary-job-v1',plannerContinuation:'durable-turn-v1'},{headers:{'Cache-Control':'no-store'}});
   const token=request.headers.get('x-paris-github-token');
   return token?await withWorkflowGitHubToken(token,diagnostic):await diagnostic();
  }
  if(body.phase==='dispatch-failure'){
   // Only the signed workflow monitor can report an unconfirmed dispatch.
   // No attempt counters are reset, and no replacement dispatch is issued.
   const token=request.headers.get('x-paris-github-token');
   if(!token)return NextResponse.json({error:'Temporary workflow authorization required.'},{status:400});
   if(!/^[a-f0-9-]{36}$/.test(body.repairId??''))return NextResponse.json({error:'Repair ID required'},{status:400});
   return await withWorkflowGitHubToken(token,async()=>NextResponse.json(await reportParisDispatchFailure(body.repairId)));
  }
  if(body.phase==='tick'){
   const token=request.headers.get('x-paris-github-token');
   const tick=async()=>NextResponse.json(await tickParisCodeRepairs({workflowOwnedDispatch:true}));
   return token?await withWorkflowGitHubToken(token,tick):await tick();
  }
  if(!/^[a-f0-9-]{36}$/.test(body.repairId??'')||!Number.isSafeInteger(body.runId))return NextResponse.json({error:'Repair and workflow run required'},{status:400});
  if(body.phase==='prepare'||body.phase==='publish'){
   const token=request.headers.get('x-paris-github-token');
   if(!token)return NextResponse.json({error:'Temporary workflow authorization required.',errorCode:'PARIS_WORKFLOW_GITHUB_TOKEN_REQUIRED'},{status:400});
   return await withWorkflowGitHubToken(token,async()=>NextResponse.json(await (body.phase==='prepare'?prepareParisRepair:publishParisRepair)(body.repairId,body.runId)));
  }
  if(body.phase==='failure'){await reportParisRepairFailure(body.repairId,body.runId);return NextResponse.json({recorded:true});}
  return NextResponse.json({error:'Unsupported phase'},{status:400});
 }catch(error){
  const {errorCode,status}=classifyParisPhaseError(error);
  console.error('[PARIS] repair phase failed',errorCode);
  return NextResponse.json({error:'PARIS repair phase failed; see the protected execution log.',errorCode},{status});
 }

}
