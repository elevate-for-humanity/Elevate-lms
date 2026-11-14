import {createDecipheriv} from 'node:crypto';
const ref='vhulnzcfmlnsmoxixjco';
export function decryptLegacy83Runtime(envelope,key){
 const payload=envelope?.runtimeCredentials;
 if(!payload||typeof payload.iv!=='string'||typeof payload.tag!=='string'||typeof payload.ciphertext!=='string')throw Error('Verified Legacy 83 runtime payload is required');
 const iv=Buffer.from(payload.iv,'base64'),tag=Buffer.from(payload.tag,'base64');
 if(iv.length!==12||tag.length!==16)throw Error('Invalid Legacy 83 runtime envelope');
 const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(tag);
 const data=JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.ciphertext,'base64')),decipher.final()]).toString('utf8'));
 const secret=data.SUPABASE_SERVICE_ROLE_KEY;
 if(typeof secret!=='string'||!secret||[10,13,0].some(code=>secret.includes(String.fromCharCode(code))))throw Error('Dedicated Legacy 83 server credential is required');
 if(!secret.startsWith('sb_secret_')){
  let claims;try{claims=JSON.parse(Buffer.from(secret.split('.')[1],'base64url').toString());}catch{throw Error('Invalid dedicated server credential');}
  if(claims.role!=='service_role'||claims.ref!==ref)throw Error('Dedicated server credential authority mismatch');
 }
 return {SUPABASE_SERVICE_ROLE_KEY:secret};
}
export async function verifyLegacy83Runtime(config,fetcher=fetch){
 const key=config.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)throw Error('Dedicated Legacy 83 server credential is required');
 const headers={apikey:key};if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
 const response=await fetcher('https://'+ref+'.supabase.co/rest/v1/academy_courses?select=id&limit=1',{headers,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Dedicated runtime database connection failed');
 return true;
}
