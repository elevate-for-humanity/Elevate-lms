import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/adapters/platform-narration.ts',import.meta.url),'utf8'),{mode:'transform'})
 .replace(/^import .*;\n/gm,'').replace('const execute = promisify(execFile);','').replace('const execute=promisify(execFile);','').replace('export class ','class ');
function harness(fail=false){
 const progress=[];let cleaned=false;
 const Provider=new Function('alignRecordedNarration','measureNarrationCaptions','configuredNarrationProvider','generateEdgeTTS','uploadLessonMediaBuffer','execute','mkdtemp','writeFile','readFile','rm','tmpdir','join','reportCourseProgress',source+'\nreturn UltimatePlatformNarration;')(
  async(_file,text)=>text.split(' ').map((word,i)=>({word,start:i*.2,end:(i+1)*.2})),()=>{},()=> 'configured',async()=>{if(fail)throw Error('TTS_FAILED');return Buffer.alloc(10);},async()=> 'https://media.example/audio.mp3',
  async()=>({stdout:'1'}),async()=>'/tmp/narration',async()=>{},async()=>Buffer.alloc(10),async()=>{cleaned=true;},()=>'/tmp',(...parts)=>parts.join('/'),
  (phase,completed,total)=>progress.push({phase,completed,total}));
 return{provider:new Provider(),progress,cleaned:()=>cleaned};
}
const input={lessonId:'lesson',artifacts:{instructor_script:{script:{segments:[{id:'scene',narrationParts:[{text:'Primary recording',isRecap:false},{text:'Fresh recap',isRecap:true}]}]}}}};
test('long narration exposes real recording, alignment, and stored-segment progress',async()=>{
 const h=harness();const result=await h.provider.generate(input);assert.equal(result.segments.length,1);
 assert.deepEqual(h.progress.filter(p=>p.phase.startsWith('narration:recording')).map(p=>p.completed),[1,2]);
 assert.deepEqual(h.progress.filter(p=>p.phase.startsWith('narration:alignment')).map(p=>p.completed),[1,2]);
 assert.deepEqual(h.progress.at(-1),{phase:'narration:stored-segments',completed:1,total:1});assert.equal(h.cleaned(),true);
});
test('a failed speech request never reports recording or segment completion',async()=>{
 const h=harness(true);await assert.rejects(h.provider.generate(input),/TTS_FAILED/);
 assert.deepEqual(h.progress,[{phase:'narration:segment',completed:0,total:1}]);assert.equal(h.cleaned(),true);
});
