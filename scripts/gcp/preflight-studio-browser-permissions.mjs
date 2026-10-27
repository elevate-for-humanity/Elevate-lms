import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {verifyStudioIdentity} from './verify-studio-service-identity.mjs';
// Existing-service release acceptance, not a request for owner-level provisioning.
export async function preflightStudioRelease({run=google,verify=verifyStudioIdentity}={}){
 const service=JSON.parse(run(['run','services','describe','elevate-studio-browser','--project='+PROJECT,'--region=us-central1','--format=json']));
 if(service.metadata?.name!=='elevate-studio-browser'||service.spec?.template?.spec?.containers?.length!==1)throw Error('STUDIO_EXISTING_TARGET_UNVERIFIED');
 const boundary=await verify({run});
 if(boundary?.attachmentVerified!==true||boundary?.bindingsVerified!==true)throw Error('STUDIO_PREPARED_BOUNDARY_UNVERIFIED');
 return {project:PROJECT,existingServiceVerified:true,attachmentVerified:boundary.attachmentVerified,bindingsVerified:boundary.bindingsVerified,readOnly:true,applicationDeployed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)preflightStudioRelease().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(JSON.stringify({error:/^STUDIO_[A-Z_]+$/.test(e.message)?e.message:'STUDIO_RELEASE_PREFLIGHT_FAILED',applicationDeployed:false}));process.exitCode=1;});
