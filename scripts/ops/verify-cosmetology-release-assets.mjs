import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const base='https://cuxzzpsyufcewtmicszk.supabase.co';
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key) throw Error('Service context unavailable');
const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
await mkdir('cosmetology-release-evidence',{recursive:true});
if(process.argv[2]==='cover'){
 const object='admin-documents/1793157078005-Prestige_Elevation_Cosmetology_Digital_Workbook.pdf';
 const response=await fetch(base+'/storage/v1/object/authenticated/documents/'+object,{headers,signal:AbortSignal.timeout(30000)});
 if(!response.ok) throw Error('Existing workbook source download failed: '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.subarray(0,5).toString()!=='%PDF-') throw Error('Source is not PDF');
 await writeFile('original-workbook.pdf',bytes);
 execFileSync('pdftoppm',['-f','1','-l','1','-singlefile','-scale-to','1600','-png','original-workbook.pdf','cosmetology-release-evidence/prestige-cosmetology-cover']);
 await writeFile('cosmetology-release-evidence/cover-source.json',JSON.stringify({source:'Existing protected Prestige Elevation Cosmetology Digital Workbook',sha256:createHash('sha256').update(bytes).digest('hex'),page:1,originalModified:false},null,2));
 console.log('Existing cover rendered; original preserved.');
}else if(process.argv[2]==='mail'){
 const secret=await fetch(base+'/rest/v1/rpc/get_platform_secret',{method:'POST',headers,body:JSON.stringify({p_key:'CRON_SECRET'}),signal:AbortSignal.timeout(15000)});
 if(!secret.ok) throw Error('Existing mail authorization unavailable');
 const cron=await secret.json();
 if(typeof cron!=='string'||!cron) throw Error('Mail authorization not configured');
 const sent=await fetch('https://admin.elevateforhumanity.org/api/cron/interoffice-mail',{headers:{Authorization:'Bearer '+cron},signal:AbortSignal.timeout(65000)});
 if(!sent.ok) throw Error('Canonical outbox processor returned '+sent.status);
 const receipt=await sent.json();
 await writeFile('cosmetology-release-evidence/mail-processor.json',JSON.stringify(receipt,null,2));
 console.log(JSON.stringify(receipt));
}else throw Error('Explicit operation required');
