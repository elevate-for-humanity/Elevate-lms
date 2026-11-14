import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function measuredWordCoverage(expected,actual){
 const tokens=x=>new Set(String(x).toLowerCase().match(/[a-z0-9]+/g)||[]);
 const source=tokens(expected),heard=tokens(actual);
 if(!source.size||!heard.size)throw Error('SUBSTANTIVE_TRANSCRIPT_REQUIRED');
 return [...source].filter(x=>heard.has(x)).length/source.size;
}
export async function main(){
 const directory=process.env.AUDIT_OUTPUT_DIR||'preserved-media-audit';
 const file=directory+'/preserved-checkpoint.mp4';
 const evidence=JSON.parse(await readFile(directory+'/evidence.json','utf8'));
 const digest=createHash('sha256').update(await readFile(file)).digest('hex');
 if(digest!==evidence.mediaSha256)throw Error('AUDITED_MEDIA_HASH_MISMATCH');
 const expected=await readFile(directory+'/canonical-script.txt','utf8');
 const {transcribeLocalAudio}=await import(pathToFileURL(process.env.ASR_MODULE_PATH||new URL('../../lib/video/local-transcription.mjs',import.meta.url).pathname).href);
 const recognized=await transcribeLocalAudio(file,{wordTimings:true});
 const coverage=measuredWordCoverage(expected,recognized.text);
 const result={mediaSha256:digest,checkedAt:new Date().toISOString(),provider:recognized.provider,model:recognized.model,actualTranscript:recognized.text,words:recognized.words,canonicalScriptSha256:createHash('sha256').update(expected).digest('hex'),uniqueWordCoverage:coverage,narrationAcceptanceVerified:false,instructionalAcceptanceVerified:false,learnerPlaybackVerified:false,databaseMutations:0};
 await writeFile(directory+'/narration-evidence.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
