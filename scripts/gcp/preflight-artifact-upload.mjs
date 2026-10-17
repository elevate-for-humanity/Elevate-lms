import {pathToFileURL} from 'node:url';
import {google} from './runtime-config.mjs';

const origin='https://us-central1-docker.pkg.dev';
const prefix='/v2/elegant-racer-299721/elevate/store/blobs/uploads/';

// Opens and cancels an empty session in the existing repository. No layer,
// manifest, tag, image, Cloud Run revision or billing setting is published.
export async function verifyArtifactUpload({run=google,request=fetch}={}) {
  const token=run(['auth','print-access-token']).trim();
  if(!token)throw Error('ARTIFACT_UPLOAD_IDENTITY_UNAVAILABLE');
  const headers={authorization:'Bearer '+token};
  const response=await request(origin+prefix,{method:'POST',headers,body:'',redirect:'error',signal:AbortSignal.timeout(30000)});
  if(response.status!==202) {
    let text='';
    if(response.body)for await(const chunk of response.body){text+=Buffer.from(chunk).toString();if(text.length>32768){await response.body.cancel?.().catch(()=>{});break;}}
    // Classify only. Never publish provider response bodies, credentials or
    // signed upload locations in errors or workflow logs.
    if(/billing.{0,150}(?:enabled|disabled)|BILLING_DISABLED/i.test(text))throw Error('ARTIFACT_UPLOAD_BILLING_BLOCKED');
    throw Error('ARTIFACT_UPLOAD_REJECTED_HTTP_'+response.status);
  }
  let location;
  try {location=new URL(response.headers.get('location')||'',origin);} catch {throw Error('ARTIFACT_UPLOAD_LOCATION_INVALID');}
  const suffix=location.pathname.slice(prefix.length);
  // OCI upload locations are opaque. Google may identify this one session in
  // upload_id rather than appending a UUID to the path. The host/repository
  // boundary is still fixed; an unqualified collection URL is never cancelled.
  const scopedSession=Boolean(suffix)||Boolean(location.searchParams.get('upload_id'));
  if(location.origin!==origin||location.username||location.password||location.hash||
    !location.pathname.startsWith(prefix)||!scopedSession||suffix.includes('/'))
    throw Object.assign(Error('ARTIFACT_UPLOAD_LOCATION_INVALID'),{safeDetails:{
      pathShape:location.pathname.split("/").map(part=>["","v2","elegant-racer-299721","elevate","store","blobs","uploads","artifacts-uploads"].includes(part)?part:"[opaque:"+part.length+"]").join("/"),
      sameOrigin:location.origin===origin,expectedPrefix:location.pathname.startsWith(prefix),
      emptySuffix:!suffix,nestedSuffix:suffix.includes('/'),hasUploadId:location.searchParams.has('upload_id'),hasQuery:Boolean(location.search),
    }});
  const cleanup=await request(location.href,{method:'DELETE',headers,redirect:'error',signal:AbortSignal.timeout(30000)});
  if(cleanup.status!==204)throw Error('ARTIFACT_UPLOAD_CLEANUP_UNVERIFIED_HTTP_'+cleanup.status);
  return {repository:'elegant-racer-299721/elevate',uploadAdmissionVerified:true,emptySessionCancelled:true,imagePublished:false,productionChanged:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  verifyArtifactUpload().then(result=>console.log(JSON.stringify(result))).catch(error=>{
    console.error(JSON.stringify({error:/^ARTIFACT_UPLOAD_[A-Z0-9_]+$/.test(error.message)?error.message:'ARTIFACT_UPLOAD_CHECK_FAILED',imagePublished:false,productionChanged:false}));process.exitCode=1;
  });
}
