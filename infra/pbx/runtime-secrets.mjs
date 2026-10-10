const RESOURCE=/^projects\/(?:elegant-racer-299721|484736877039)\/secrets\/[A-Za-z0-9_-]+\/versions\/(?:[0-9]+|latest)$/;
const ROLES={gateway:{PARIS_ARI_PASSWORD:'PARIS_ARI_PASSWORD_SECRET',PARIS_TURN_TOKEN:'PARIS_TURN_TOKEN_SECRET'},
  turn:{PARIS_TURN_TOKEN:'PARIS_TURN_TOKEN_SECRET'}};
export async function loadRoleSecrets(role,{environment=process.env,request=fetch}={}){
  if(!Object.hasOwn(ROLES,role))throw Error('PBX_RUNTIME_ROLE_INVALID');
  const required=ROLES[role];
  for(const ref of Object.values(required))if(!RESOURCE.test(environment[ref]||''))throw Error('PBX_SECRET_REFERENCE_INVALID');
  const response=await request('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    {headers:{'Metadata-Flavor':'Google'},redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('PBX_WORKLOAD_IDENTITY_UNAVAILABLE');
  const {access_token:token}=await response.json();
  if(typeof token!=='string' || !token)throw Error('PBX_WORKLOAD_IDENTITY_UNAVAILABLE');
  const values={};
  for(const [key,ref] of Object.entries(required)){
    const secret=await request(`https://secretmanager.googleapis.com/v1/${environment[ref]}:access`,
      {headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!secret.ok)throw Error('PBX_SECRET_ACCESS_DENIED');
    const body=await secret.json();
    if(typeof body.payload?.data!=='string')throw Error('PBX_SECRET_PAYLOAD_MISSING');
    const value=Buffer.from(body.payload.data,'base64').toString('utf8').trim();
    if(value.length<32 || value.length>1024 || /[\r\n\0]/.test(value))throw Error('PBX_SECRET_PAYLOAD_INVALID');
    values[key]=value;
  }
  return values;
}
