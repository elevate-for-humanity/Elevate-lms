import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
export const GITHUB_RUNTIME_KEY='GITHUB_TOKEN';
export const GITHUB_RUNTIME_SECRET='elevate-admin-github-token';
/** Validate the existing Google binding; emit names/version only, never payloads. */
export async function githubRuntimeBinding({run=google,request=fetch}={}){
 let version,token;
 try{
  const metadata=JSON.parse(run(['secrets','versions','describe','latest','--secret',GITHUB_RUNTIME_SECRET,'--project',PROJECT,'--format=json(name,state)']));
  const match=metadata.name?.match(/^projects\/(?:484736877039|elegant-racer-299721)\/secrets\/elevate-admin-github-token\/versions\/([1-9][0-9]*)$/);
  if(!match||metadata.state!=='ENABLED')throw Error();version=match[1];
  token=run(['secrets','versions','access',version,'--secret',GITHUB_RUNTIME_SECRET,'--project',PROJECT]).trim();
 }catch{throw Error('GITHUB_RUNTIME_SECRET_UNAVAILABLE');}
 if(!token||/\s/.test(token))throw Error('GITHUB_RUNTIME_TOKEN_INVALID');
 let response;
 try{response=await request('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});}
 catch{throw Error('GITHUB_RUNTIME_CHECK_UNAVAILABLE');}
 if(!response.ok)throw Error([401,403,404].includes(response.status)?'GITHUB_RUNTIME_TOKEN_REJECTED':'GITHUB_RUNTIME_CHECK_UNAVAILABLE');
 return ['--remove-env-vars='+GITHUB_RUNTIME_KEY,'--update-secrets='+GITHUB_RUNTIME_KEY+'='+GITHUB_RUNTIME_SECRET+':'+version];
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)githubRuntimeBinding().then(flags=>console.log(flags.join('\n'))).catch(error=>{console.error(/^GITHUB_RUNTIME_[A-Z_]+$/.test(error.message)?error.message:'GITHUB_RUNTIME_BINDING_FAILED');process.exitCode=1;});
