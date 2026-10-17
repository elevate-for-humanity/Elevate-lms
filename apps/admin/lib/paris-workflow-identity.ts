import {createRemoteJWKSet,jwtVerify} from 'jose';

// Accept only short-lived, GitHub-signed identities from the two explicitly
// authorized PARIS workflows on main. No user-managed shared secret.
const ISSUER='https://token.actions.githubusercontent.com';
const AUDIENCE='elevate-paris-code-repair';
const JWKS=createRemoteJWKSet(new URL(ISSUER+'/.well-known/jwks'));
const WORKFLOWS=new Set([
 '.github/workflows/paris-code-repair.yml',
 '.github/workflows/verify-paris-production-authorization.yml',
]);
export async function authorizeParisWorkflow(header:string|null):Promise<boolean>{
 const token=/^Bearer (\S+)$/.exec(header||'')?.[1];
 if(!token)return false;
 try{
  const {payload}=await jwtVerify(token,JWKS,{issuer:ISSUER,audience:AUDIENCE,algorithms:['RS256'],clockTolerance:5});
  if(payload.repository!=='elevate-for-humanity/Elevate-lms'||payload.ref!=='refs/heads/main'||payload.repository_visibility==='public')return false;
  const workflowRef=String(payload.job_workflow_ref||payload.workflow_ref||'');
  const path=workflowRef.match(/^elevate-for-humanity\/Elevate-lms\/(\.github\/workflows\/[^@]+)@refs\/heads\/main$/)?.[1];
  return Boolean(path&&WORKFLOWS.has(path));
 }catch{return false;}
}
