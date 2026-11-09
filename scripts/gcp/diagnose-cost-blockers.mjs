import {google,loadGoogleConfig,PROJECT} from './runtime-config.mjs';
const scope=['--project='+PROJECT];
const vm=JSON.parse(google(['compute','instances','describe','elevate-studio-browser-trial',...scope,'--zone=us-central1-a','--format=json']));
console.log(JSON.stringify({kind:'trial-ownership',name:vm.name,idType:typeof vm.id,id:vm.id,zone:vm.zone,purpose:vm.labels?.purpose,disks:vm.disks?.map(d=>({source:d.source,autoDelete:d.autoDelete,boot:d.boot})),status:vm.status}));
try {
 const rows=JSON.parse(google(['logging','read','resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-marketing-migration" AND textPayload:"[natural-voice]"',...scope,'--freshness=2h','--limit=20','--format=json']));
 const codes=[...new Set(rows.flatMap(r=>(r.textPayload||'').match(/SPEECH_CACHE_[A-Z_]+|requireAdminClient\(\): SUPABASE_SERVICE_ROLE_KEY is not set|Google Cloud speech returned HTTP [0-9]+ \([A-Z_]+\)/g)||[]))];
 console.log(JSON.stringify({kind:'speech-error-codes',codes,matchingRows:rows.length}));
}catch(error){console.log(JSON.stringify({kind:'speech-error-codes',unavailable:true,code:error.code||'unknown'}));}
try {
 const env=loadGoogleConfig('marketing').runtimeEnvironment;
 const base=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw Error('DIAGNOSTIC_STORAGE_CONFIGURATION_MISSING');
 const response=await fetch(base+'/storage/v1/bucket/speech-cache',{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)});
 const body=await response.json().catch(()=>({}));
 console.log(JSON.stringify({kind:'speech-cache-storage-access',status:response.status,bucketPresent:body.id==='speech-cache',private:body.public===false,errorCode:/^[a-zA-Z0-9_ ]{1,80}$/.test(body.error||'')?body.error:null}));
}catch(error){console.log(JSON.stringify({kind:'speech-cache-storage-access',unavailable:true,code:/^DIAGNOSTIC_[A-Z_]+$/.test(error.message)?error.message:error.code||'unknown'}));}
