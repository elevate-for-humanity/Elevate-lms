import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {measuredCaptions,toSrt,toAss} from './repair-preserved-cosmetology-captions.mjs';
const run=promisify(execFile);
export const SOURCE_SHA='8fb667f92510e276ccc18c2f72d599af620a4178f6bece30f7fe20d4067c679b';
const ORIGIN='https://cuxzzpsyufcewtmicszk.supabase.co';
export const ASSETS=[
  {
    "id": "a102c0f0-8508-48f4-936f-4e34a88ce714",
    "title": "Cosmetology Training Room with Mannequin Heads",
    "path": "9ca9fb50-7119-46ea-ab81-9b0193c29c31/1790027396417-cosmetology-training-room-with-mannequin-heads-2026-09-17-16-12-34-utc.mp4",
    "entitlementId": "79d537ad-ef76-4340-b455-143851fa3351",
    "sha256": "ab3a92f4ddb2f23962b2e347a89cabd73d6f37a6502079193a9025c12ca776ed",
    "certificateSha256": "83d9f441b47b5540bb23af78c8e3232cf779392da07581227fc516d31bb3d8b7",
    "licenseUrl": "https://chatgpt.com/api/library/files/libfile_4de8c3e51c008191b4bd3b920e4e8f89/download#license_certificate_L7RV5Q6X3N.pdf"
  },
  {
    "id": "2667905c-a5a2-41bf-b3d4-a82ac368e59b",
    "title": "Makeup Artistry Students Working in Beauty Studio",
    "path": "9ca9fb50-7119-46ea-ab81-9b0193c29c31/1790027927493-makeup-artistry-students-working-in-beauty-studio-2026-09-17-13-50-08-utc.mp4",
    "entitlementId": "749ef0a1-a4e9-4f9e-a2b3-a0ab6a7bbdab",
    "sha256": "e9fb42cef1bd1aafb43e9d733ccac3caed7f806e31bc1597c37e09f30539759c",
    "certificateSha256": "fd97bbc61c2e8b8eef01d7f6840506973baa8273bf37b571b969739bda2bc7b7",
    "licenseUrl": "https://chatgpt.com/api/library/files/libfile_4de8c3e51c008191b4bd3b920e4e8f89/download#license_certificate_HLSZPCNQKG.pdf"
  },
  {
    "id": "18185502-6c09-41b4-a0ef-b0e1505918c6",
    "title": "Hair Stylist and Female Client Discussing Style Using a Tablet",
    "path": "9ca9fb50-7119-46ea-ab81-9b0193c29c31/1790028046997-hair-stylist-and-female-client-discussing-style-us-2026-09-18-08-08-54-utc.mp4",
    "entitlementId": "58e6e282-114b-44ac-b924-6b66d2a66894",
    "sha256": "2d58a4356b81f6443c778a311bba2daf1850088d77928c84a3818ee1021a2576",
    "certificateSha256": "b8ca8dad32a50bf9528461e2b0207dcd10b42488c609dcdbdd3c35ff7c8d61cb",
    "licenseUrl": "https://chatgpt.com/api/library/files/libfile_4de8c3e51c008191b4bd3b920e4e8f89/download#license_certificate_5JV2G4W9QY.pdf"
  },
  {
    "id": "d1f75fd8-3b21-4fec-857c-8e8804a4386f",
    "title": "Clean Salon Workplace Virus Prevention Female Hand",
    "path": "9ca9fb50-7119-46ea-ab81-9b0193c29c31/1790029131048-woman-disinfecting-table-in-professional-manicure-2026-09-17-20-43-57-utc.mp4",
    "entitlementId": "92356b82-f0ff-482e-b18f-c0219adbcf1b",
    "sha256": "3dd185073adc229ea2fc23ca5af4347f7b33a08c88838cc9bc9c358f6957d814",
    "certificateSha256": "e0d3615c8db75a9337f4c4b91a3196c22eb0e24cf4d642734596114bf0177783",
    "licenseUrl": "https://chatgpt.com/api/library/files/libfile_4de8c3e51c008191b4bd3b920e4e8f89/download#license_certificate_82PFM6H3AR.pdf"
  },
  {
    "id": "e1636aa3-468e-4335-80e5-dcc6d6c4efeb",
    "title": "Hair Stylist Sanitizes Tools on Cart",
    "path": "9ca9fb50-7119-46ea-ab81-9b0193c29c31/1790030074396-hair-stylist-sanitizes-tools-on-cart-2026-09-16-18-28-37-utc.mov",
    "entitlementId": "82fdec73-7a98-4e06-9661-062ba536b6bf",
    "sha256": "5da6499ab96c4cddede38eaae0516defa210ef277077ff1001963a03bb001aef",
    "certificateSha256": "bf63d0ed7a6add258ece92e141eecb412c86a9d258b1d5702b44d985f79b5161",
    "licenseUrl": "https://chatgpt.com/api/library/files/libfile_4de8c3e51c008191b4bd3b920e4e8f89/download#license_certificate_ZVAGS7BE95.pdf"
  }
];
// Boundaries measured from the preserved encoded film's actual scene changes.
// These are contextual examples, never proof of a complete disinfection or emergency procedure.
export const CONTEXT_PANEL_FILTER='scale=850:450:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=850:450:(ow-iw)/2:(oh-ih)/2:color=0x131c21,setsar=1,fps=24';
export const TITLES=["A safe service starts\nbefore the client sits down","Cleaning and disinfection\nare different jobs","Read the label and\nprotect the clean area","Case practice: a used comb\non a clean tray","Observation and\nsafe service decisions","Emergency readiness: call for help\nand stay within training","Three decisions to\ncarry into the salon"];
export const SECTIONS=[
 {start:0,end:935/24,asset:0,note:'Salon readiness | Contextual training footage'},
 {start:935/24,end:1948/24,asset:4,note:'Tool handling | Spraying alone does not prove disinfection'},
 {start:1948/24,end:2934/24,asset:3,note:'Surface cleaning | Follow the full product label'},
 {start:2934/24,end:3817/24,asset:3,note:'Restore the clean area before serving the next client'},
 {start:3817/24,end:4773/24,asset:2,note:'Consultation context | Observe, document and defer unsafe services'},
 {start:4773/24,end:5866/24,asset:0,note:'Emergency awareness | Training context, not a demonstration'},
 {start:5866/24,end:7009/24,asset:1,note:'Review your decisions | Practical skills need instructor verification'}
];
const sha=b=>createHash('sha256').update(b).digest('hex');
export function validateAsset(row,asset,entitlement){
 if(!row||row.id!==asset.id||row.course_id!=='a6b0b712-1cf0-475a-ba79-ee2023dea8ec'||row.storage_path!==asset.path||row.entitlement_id!==asset.entitlementId||row.asset_role!=='source_broll')throw Error('EXACT_REVIEWED_SOURCE_REQUIRED');
 const m=entitlement?.metadata;
 if(entitlement?.id!==asset.entitlementId||entitlement.provider!=='envato'||m?.visual_observation?.contentSha256!==asset.sha256||m?.license_certificate_sha256!==asset.certificateSha256||m?.license_evidence_url!==asset.licenseUrl||m?.license_certificate_verification!=='matched_item_id_license_code_project_and_licensee')throw Error('EXISTING_VERIFIED_ENTITLEMENT_REQUIRED');
 if(!/^https:\/\//.test(asset.licenseUrl)||!m.visual_observation.visibleActions?.length)throw Error('LICENSE_AND_REVIEW_REQUIRED');
 return true;
}
export function validateSections(sections,duration){
 let previous=0;
 for(const s of sections){
 if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||Math.abs(s.start-previous)>0.001||s.end<=s.start||s.end>duration+0.05||!Number.isInteger(s.asset)||!ASSETS[s.asset])throw Error('CONTIGUOUS_SOURCE_SCENES_REQUIRED');
 previous=s.end;
 }
 if(Math.abs(previous-duration)>0.05)throw Error('FULL_SOURCE_DURATION_REQUIRED');
 return true;
}
async function audioSha(file){return sha((await run('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],{encoding:'buffer',timeout:120000,maxBuffer:32*1024*1024})).stdout);}
async function request(path,headers,options={}){
 const r=await fetch(ORIGIN+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw Error('SOURCE_READ_HTTP_'+r.status);
 return r;
}
export async function main(){
 const dir=resolve(process.env.AUDIT_OUTPUT_DIR||'preserved-media-audit');await mkdir(dir+'/motion',{recursive:true});
 const source=dir+'/preserved-checkpoint.mp4',bytes=await readFile(source);
 const evidence=JSON.parse(await readFile(dir+'/evidence.json','utf8')),speech=JSON.parse(await readFile(dir+'/narration-evidence.json','utf8'));
 if(sha(bytes)!==SOURCE_SHA||evidence.mediaSha256!==SOURCE_SHA||speech.mediaSha256!==SOURCE_SHA)throw Error('EXACT_PRESERVED_BYTES_REQUIRED');
 validateSections(SECTIONS,evidence.durationSeconds);
 const token=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!token)throw Error('DATABASE_AUTH_REQUIRED');
 const headers={apikey:token,Authorization:'Bearer '+token};
 const proofs=[];
 for(const [i,a]of ASSETS.entries()){
 const rows=await (await request('/rest/v1/course_videos?id=eq.'+a.id+'&select=id,course_id,storage_path,asset_role,entitlement_id',headers)).json();
 const entitlements=await (await request('/rest/v1/licensed_media_entitlements?id=eq.'+a.entitlementId+'&select=id,provider,provider_item_id,metadata',headers)).json();
 validateAsset(rows[0],a,entitlements[0]);
 const signed=await (await request('/storage/v1/object/sign/course_videos/'+a.path,headers,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:900})})).json();
 if(!signed.signedURL?.startsWith('/object/sign/course_videos/'+a.path+'?'))throw Error('EXACT_SIGNED_SOURCE_REQUIRED');
 const video=Buffer.from(await (await request('/storage/v1'+signed.signedURL,{})).arrayBuffer());
 if(sha(video)!==a.sha256)throw Error('REVIEWED_SOURCE_HASH_MISMATCH');
 await writeFile(dir+'/motion/source-'+i+'.mp4',video);
 proofs.push({...a,provider:'envato',providerItemId:entitlements[0].provider_item_id,visibleActions:entitlements[0].metadata.visual_observation.visibleActions});
 }
 // Preserve original headers/sequence and replace only the still-photo rectangle.
 // Source clips may repeat within a long discussion; they are explicitly contextual.
 for(const [i,s]of SECTIONS.entries()){
 await writeFile(dir+'/motion/note-'+i+'.txt',s.note);
 await writeFile(dir+'/motion/title-'+i+'.txt',TITLES[i]);
 const duration=s.end-s.start;
 const filters="[1:v]"+CONTEXT_PANEL_FILTER+"[m];[0:v]drawbox=x=0:y=45:w=iw:h=109:color=0x131c21:t=fill[base];[base][m]overlay=215:154:enable='gte(t,"+(i===0?2:0)+")',drawbox=x=0:y=606:w=iw:h=114:color=0x131c21:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=motion/title-"+i+".txt:fontcolor=white:fontsize=48:line_spacing=2:x=32:y=50,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=motion/note-"+i+".txt:fontcolor=white:fontsize=32:x=(w-tw)/2:y=613,format=yuv420p[v]";
 await run('ffmpeg',['-hide_banner','-loglevel','error','-ss',String(s.start),'-i',source,'-stream_loop','-1','-i',dir+'/motion/source-'+s.asset+'.mp4','-filter_complex_threads','1','-filter_complex',filters,'-map','[v]','-an','-t',String(duration),'-r','24','-c:v','libx264','-threads','2','-preset','fast','-crf','18','-y','motion/section-'+i+'.mp4'],{cwd:dir,timeout:180000,maxBuffer:2*1024*1024});
 }
 await writeFile(dir+'/motion/concat.txt',SECTIONS.map((s,i)=>"file 'section-"+i+".mp4'").join('\n'));
 await run('ffmpeg',['-v','error','-f','concat','-safe','0','-i','motion/concat.txt','-c','copy','-y','motion/joined.mp4'],{cwd:dir,timeout:120000});
 const cues=measuredCaptions(speech.words,evidence.durationSeconds);
 await writeFile(dir+'/motion/measured-captions.srt',toSrt(cues));
 const ass=toAss(cues).replace('DejaVu Sans,28,','DejaVu Sans,42,');
 await writeFile(dir+'/motion/measured-captions.ass',ass);
 const output=dir+'/motion-repair-candidate.mp4';
 await run('ffmpeg',['-v','error','-i','motion/joined.mp4','-i',source,'-vf','ass=motion/measured-captions.ass','-map','0:v:0','-map','1:a:0','-c:v','libx264','-threads','2','-preset','fast','-crf','18','-c:a','copy','-movflags','+faststart','-y',output],{cwd:dir,timeout:300000,maxBuffer:2*1024*1024});
 const originalAudioSha=await audioSha(source),candidateAudioSha=await audioSha(output);
 if(originalAudioSha!==candidateAudioSha)throw Error('ORIGINAL_NARRATION_CHANGED');
 await run('ffmpeg',['-v','error','-xerror','-i',output,'-map','0:v:0','-map','0:a:0','-f','null','-'],{timeout:120000});
 const measurements=await run('ffmpeg',['-hide_banner','-i',output,'-vf','freezedetect=n=-50dB:d=4,blackdetect=d=0.5:pix_th=0.10','-af','silencedetect=noise=-40dB:d=1','-f','null','-'],{timeout:120000,maxBuffer:4*1024*1024});
 const events=measurements.stderr.split('\n').filter(x=>/freeze_start|freeze_duration|freeze_end|black_start|silence_start|silence_end/.test(x));
 for(const [i,s]of SECTIONS.entries())await run('ffmpeg',['-v','error','-ss',String(s.start+5),'-i',output,'-frames:v','1','-y',dir+'/motion-sample-'+i+'.png'],{timeout:30000});
 const report={sourceMediaSha256:SOURCE_SHA,candidateMediaSha256:sha(await readFile(output)),originalAudioSha,candidateAudioSha,identicalNarrationBytes:true,decodePassed:true,scope:'licensed-contextual-motion-and-measured-captions-only',measuredCaptionCount:cues.length,sections:SECTIONS,licensedSources:proofs,measuredEvents:events,instructionalAcceptanceVerified:false,learnerPlaybackVerified:false,canonicalPublicationChanged:false,databaseMutations:0};
 await writeFile(dir+'/motion-repair-evidence.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
