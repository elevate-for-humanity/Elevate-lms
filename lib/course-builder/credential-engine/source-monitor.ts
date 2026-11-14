import 'server-only';
import {createHash} from 'node:crypto';
import {requireAdminClient} from '@/lib/supabase/admin';
import type {CredentialDefinition} from './credential-registry-universal';
import type {BlueprintStatus} from './blueprint-monitor';

/** Compare approved official source bytes; this does not certify course compliance. */
export async function observeBlueprintSource(credential:CredentialDefinition):Promise<BlueprintStatus>{
 const db=await requireAdminClient();
 const {data:reference,error:referenceError}=await db.from('credential_blueprints').select('source_reference,blueprint_status').eq('blueprint_code',credential.blueprintSlug||credential.slug).maybeSingle();
 if(referenceError)throw referenceError;
 if(!reference||!['approved','published','active'].includes(reference.blueprint_status))throw new Error('BLUEPRINT_APPROVED_SOURCE_REQUIRED');
 const url=new URL(reference.source_reference);
 const officialHosts=['epa.gov','osha.gov','in.gov','nhanow.com','nccer.org','pearsonvue.com','certiport.com','act.org','nremt.org'];
 if(url.protocol!=='https:'||url.username||url.password||url.port||!officialHosts.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))throw new Error('BLUEPRINT_OFFICIAL_SOURCE_REQUIRED');
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30_000),cache:'no-store'});
 if(!response.ok)throw new Error(`BLUEPRINT_SOURCE_HTTP_${response.status}`);
 if(!response.body)throw new Error('BLUEPRINT_SOURCE_EMPTY');
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>10*1024*1024)throw new Error('BLUEPRINT_SOURCE_TOO_LARGE');chunks.push(value);}}
 finally{await reader.cancel().catch(()=>undefined);}
 if(!size)throw new Error('BLUEPRINT_SOURCE_EMPTY');
 const hash='sha256:'+createHash('sha256').update(Buffer.concat(chunks)).digest('hex');
 const {data:previous,error:readError}=await db.from('blueprint_monitors').select('id,last_version').eq('credential_slug',credential.slug).maybeSingle();
 if(readError)throw readError;
 const baseline=typeof previous?.last_version==='string'&&previous.last_version.startsWith('sha256:');
 const changed=baseline&&previous.last_version!==hash;
 const observedAt=new Date().toISOString();
 const changes=changed?[{credentialSlug:credential.slug,changeType:'modified' as const,description:'Official source bytes changed. Review the document before changing curriculum.',severity:'high' as const,detectedAt:observedAt,source:url.href}]:[];
 const row={credential_slug:credential.slug,provider:credential.provider,last_checked:observedAt,last_version:hash,last_status:baseline?(changed?'source_changed':'source_unchanged'):'baseline_recorded',changes_detected:changes.length,updated_at:observedAt};
 const write=previous?.id?db.from('blueprint_monitors').update(row).eq('id',previous.id):db.from('blueprint_monitors').insert(row);
 const {data:saved,error:saveError}=await write.select('id').maybeSingle();
 if(saveError)throw saveError;if(!saved?.id)throw new Error('BLUEPRINT_OBSERVATION_RECEIPT_MISSING');
 return{credentialSlug:credential.slug,credentialName:credential.name,lastChecked:observedAt,status:baseline?(changed?'source_changed':'source_unchanged'):'baseline_recorded',lastVersion:hash,changes,
  verificationScope:'official-source-bytes',sourceUrl:url.href,initialObservation:!baseline};
}
