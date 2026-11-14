const identities=new Map();
const fail=()=>{throw Error('ELEVATE_GOOGLE_MODEL_IDENTITY_UNAVAILABLE');};

/**
 * Keep the model's application token separate from Cloud Run invocation IAM.
 * @param {string} base
 * @param {string} token
 * @param {{ env?: typeof process.env, request?: typeof fetch, signal?: AbortSignal, now?: () => number }} [options]
 */
export async function ownedModelHeaders(base,token,{env=process.env,request=fetch,signal,now=()=>Date.now()}={}) {
 signal?.throwIfAborted();
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 // GPU may use Runpod while the CPU endpoint retains private Google IAM.
 const gpu=env.PARIS_GPU_ENABLED==='true' && env.PARIS_INFERENCE_TIER==='gpu';
 const iam=gpu ? env.ELEVATE_LLM_GPU_GOOGLE_IAM ?? env.ELEVATE_LLM_GOOGLE_IAM : env.ELEVATE_LLM_GOOGLE_IAM;
 if(iam!=='true')return headers;
 let url;try{url=new URL(base);}catch{fail();}
 if(url.protocol!=='https:'||!url.hostname.endsWith('.run.app')||url.username||url.password||url.search||url.hash||url.pathname!=='/')fail();
 const audience=url.origin;
 let identity=identities.get(audience);
 if(!identity||identity.expiresAt<=now()) {
  const metadata=new URL('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity');
  metadata.searchParams.set('audience',audience);metadata.searchParams.set('format','full');
  let response;try{response=await request(metadata,{method:'GET',headers:{'Metadata-Flavor':'Google'},redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(5000)]):AbortSignal.timeout(5000)});}catch(error){signal?.throwIfAborted();fail();}
  if(!response.ok)fail();
  let value;try{value=(await response.text()).trim();}catch{fail();}
  if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value))fail();
  let claims;try{claims=JSON.parse(Buffer.from(value.split('.')[1],'base64url').toString('utf8'));}catch{fail();}
  if(claims.aud!==audience||!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||!Number.isFinite(claims.exp)||claims.exp*1000<=now()+60000)fail();
  identity={value,expiresAt:Math.min(claims.exp*1000-60000,now()+1800000)};
  if(identities.size>=4)identities.delete(identities.keys().next().value);
  identities.set(audience,identity);
 }
 headers['X-Serverless-Authorization']='Bearer '+identity.value;
 return headers;
}
