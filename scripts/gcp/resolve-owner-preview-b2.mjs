import {courseB2Environment} from './deploy-course-job.mjs';

/** Read-only discovery using the already authorized media key pair. Derive
 * region and delivery from Backblaze, never from an old Cloudflare endpoint.
 * No key creation, permission change, bucket mutation, or secret write. */
export async function resolveOwnerPreviewB2(env,request=fetch){
  let keyId=env.ELEVATE_MEDIA_ACCESS_KEY_ID,secret=env.ELEVATE_MEDIA_SECRET_ACCESS_KEY;
  let connectionSource='existing-worker';
  if(!/^00[0-9a-f]{23}$/i.test(keyId??'')||!secret){
    if(env.NEXT_PUBLIC_SUPABASE_URL!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)
      throw Error('OWNER_PREVIEW_B2_AUTHORIZED_SOURCE_REQUIRED');
    async function canonical(key){
      const response=await request(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/get_platform_secret',{
        method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'content-type':'application/json'},
        body:JSON.stringify({p_key:key}),redirect:'error',signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error('OWNER_PREVIEW_B2_SOURCE_HTTP_'+response.status);
      const value=await response.json();if(typeof value!=='string'||!value.trim())throw Error('OWNER_PREVIEW_B2_KEY_PAIR_INCOMPLETE');
      return value.trim();
    }
    // Both values come from the same explicit family; never mix identities.
    keyId=await canonical('ELEVATE_MEDIA_ACCESS_KEY_ID');
    secret=await canonical('ELEVATE_MEDIA_SECRET_ACCESS_KEY');
    connectionSource='canonical-platform';
  }
  const response=await request('https://api.backblazeb2.com/b2api/v4/b2_authorize_account',{
    headers:{Authorization:'Basic '+Buffer.from(keyId+':'+secret).toString('base64')},
    redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('OWNER_PREVIEW_B2_AUTH_HTTP_'+response.status);
  const auth=await response.json(),storage=auth.apiInfo?.storageApi;
  const origin=(value,pattern)=>{
    let url;try{url=new URL(value);}catch{throw Error('OWNER_PREVIEW_B2_ENDPOINT_INVALID');}
    if(url.protocol!=='https:'||!pattern.test(url.hostname)||url.port||url.username||url.password||url.search||url.hash||url.pathname!=='/')
      throw Error('OWNER_PREVIEW_B2_ENDPOINT_INVALID');
    return url.origin;
  };
  const endpoint=origin(storage?.s3ApiUrl,/^s3\.[a-z0-9-]+\.backblazeb2\.com$/);
  const download=origin(storage?.downloadUrl,/^f[0-9]+\.backblazeb2\.com$/);
  const api=origin(storage?.apiUrl,/^api[0-9]+\.backblazeb2\.com$/);
  const allowed=storage?.allowed;
  if(!['listFiles','readFiles','writeFiles','listBuckets'].every(c=>allowed?.capabilities?.includes(c))||allowed.namePrefix)
    throw Error('OWNER_PREVIEW_B2_EXISTING_KEY_SCOPE_INSUFFICIENT');
  if(Array.isArray(allowed.buckets)&&!allowed.buckets.some(b=>b.name==='elevate-course-media'))
    throw Error('OWNER_PREVIEW_B2_APPROVED_BUCKET_NOT_AUTHORIZED');
  const buckets=await request(api+'/b2api/v4/b2_list_buckets',{
    method:'POST',headers:{Authorization:auth.authorizationToken,'content-type':'application/json'},
    body:JSON.stringify({accountId:auth.accountId,bucketName:'elevate-course-media'}),
    redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!buckets.ok)throw Error('OWNER_PREVIEW_B2_BUCKET_HTTP_'+buckets.status);
  const bucket=(await buckets.json()).buckets?.find(b=>b.bucketName==='elevate-course-media');
  if(!['allPublic','allPrivate'].includes(bucket?.bucketType))throw Error('OWNER_PREVIEW_B2_APPROVED_BUCKET_REQUIRED');
  return {connectionSource,environment:courseB2Environment({ELEVATE_MEDIA_ENDPOINT:endpoint,
    ELEVATE_MEDIA_ACCESS_KEY_ID:keyId,ELEVATE_MEDIA_SECRET_ACCESS_KEY:secret,
    ELEVATE_MEDIA_BUCKET:'elevate-course-media',ELEVATE_MEDIA_PUBLIC_URL:download+'/file/elevate-course-media'})};
}
