import {readFile,writeFile,mkdir,readdir,stat,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const SYSTEM=process.env.PBX_PHONE_SYSTEM_ID;
if(!/^[0-9a-f-]{36}$/i.test(SYSTEM||''))throw Error('VOICEMAIL_SYSTEM_UNCONFIGURED');
const SECRET=process.env.PBX_PROVISIONING_TOKEN_SECRET;
if(!/^projects\/(elegant-racer-299721|484736877039)\/secrets\/[A-Za-z0-9_-]+\/versions\/([0-9]+|latest)$/.test(SECRET||''))throw Error('VOICEMAIL_SECRET_UNCONFIGURED');
const ledger='/var/lib/elevate-pbx/voicemail';
await mkdir(ledger,{recursive:true,mode:0o700});
async function token(){
 const metadata=await fetch('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},signal:AbortSignal.timeout(5000),redirect:'error'});
 if(!metadata.ok)throw Error('VOICEMAIL_IDENTITY_UNAVAILABLE');
 const key=(await metadata.json()).access_token;
 const secret=await fetch('https://secretmanager.googleapis.com/v1/'+SECRET+':access',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!secret.ok)throw Error('VOICEMAIL_CREDENTIAL_UNAVAILABLE');
 const value=Buffer.from((await secret.json()).payload.data,'base64').toString().trim();
 if(value.length<32)throw Error('VOICEMAIL_CREDENTIAL_INVALID');
 return value;
}
function messageIdentity(extension,metadata){
 const hash=createHash('sha256').update(SYSTEM+':'+extension+':'+metadata.origtime+':'+metadata.callerchan).digest('hex').slice(0,32);
 return hash.slice(0,8)+'-'+hash.slice(8,12)+'-5'+hash.slice(13,16)+'-a'+hash.slice(17,20)+'-'+hash.slice(20);
}
function caller(value){
 const selected=String(value||'').match(/<([^>]+)>/)?.[1]||'unknown';
 const digits=selected.replace(/[^0-9]/g,'');
 if(digits.length===10)return '+1'+digits;
 if(digits.length===11&&digits[0]==='1')return '+'+digits;
 if(digits.length<=3&&digits.length)return digits;
 if(/^[+][1-9][0-9]{7,14}$/.test(selected))return selected;
 return 'unknown';
}
async function scan(){
 const mounts=JSON.parse(execFileSync('docker',['inspect','pbx_asterisk_1','--format','{{json .Mounts}}'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
 const mount=mounts.find(x=>x.Destination==='/var/spool/asterisk');
 if(!mount?.Source||!mount.Source.startsWith('/'))throw Error('VOICEMAIL_SPOOL_UNVERIFIED');
 const base=await realpath(mount.Source+'/voicemail/elevate').catch(()=>null);if(!base)return;
 const authorization=await token();
 for(const extension of await readdir(base)){
  if(!/^(0|[1-9][0-9]{2})$/.test(extension))continue;
  const folder=base+'/'+extension+'/INBOX';
  if(await realpath(folder).catch(()=>null)!==folder)continue;
  for(const filename of await readdir(folder)){
   if(!/^msg[0-9]+[.]txt$/.test(filename))continue;
   // One malformed or temporarily failing recording must not prevent the
   // remaining mailboxes from being delivered during this scan.
   try {
   const audioName=folder+'/'+filename.replace(/[.]txt$/,'.wav');
   if(await realpath(audioName).catch(()=>null)!==audioName)continue;
   const audioStat=await stat(audioName);
   if(audioStat.size<44||audioStat.size>1100000||Date.now()-audioStat.mtimeMs<10000)continue;
   const values=Object.fromEntries((await readFile(folder+'/'+filename,'utf8')).split(String.fromCharCode(10)).filter(line=>line.includes('=')).map(line=>{const position=line.indexOf('=');return [line.slice(0,position).trim(),line.slice(position+1).trim()];}));
   const duration=Number(values.duration);const timestamp=Number(values.origtime);
   if(!Number.isFinite(duration)||duration<0||duration>60||!Number.isFinite(timestamp)||timestamp<=0||!values.callerchan)continue;
   const id=messageIdentity(extension,values);
   if(await stat(ledger+'/'+id).catch(()=>null))continue;
   const audio=await readFile(audioName);
   const response=await fetch('https://admin.elevateforhumanity.org/api/internal/phone/voicemail',{method:'POST',headers:{Authorization:'Bearer '+authorization,'Content-Type':'application/json'},body:JSON.stringify({id,extension,caller:caller(values.callerid),durationSeconds:duration,createdAt:new Date(timestamp*1000).toISOString(),audioBase64:audio.toString('base64')}),redirect:'error',signal:AbortSignal.timeout(120000)});
   if(!response.ok){process.stderr.write('OWNED_VOICEMAIL_INGEST_REQUIRES_RETRY_'+response.status+String.fromCharCode(10));continue;}
   const result=await response.json();if(result.saved!==true)throw Error('VOICEMAIL_SAVE_UNCONFIRMED');
   await writeFile(ledger+'/'+id,JSON.stringify({saved:true,transcriptAvailable:result.transcriptAvailable===true}),{mode:0o600,flag:'wx'});
   } catch {
    // Keep the original Asterisk recording and retry on the next scan.
    // Do not log caller information, audio, SIP credentials, or transcripts.
    process.stderr.write('OWNED_VOICEMAIL_MESSAGE_REQUIRES_RETRY'+String.fromCharCode(10));
   }
  }
 }
}
for(;;){try{await scan();}catch{process.stderr.write('OWNED_VOICEMAIL_SCAN_REQUIRES_RETRY'+String.fromCharCode(10));}await new Promise(resolve=>setTimeout(resolve,15000));}
