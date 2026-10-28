import { narrationRateForRepair } from '../../lib/ultimate-course-builder/instructional/narration-pace.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/adapters/platform-narration.ts',import.meta.url),'utf8'),{mode:'transform'})
 .replace(/^import .*;\n/gm,'').replace('const execute = promisify(execFile);','').replace('const execute=promisify(execFile);','').replace('export class ','class ');
function harness(fail=false,{alignmentError,recognizerError}={}){
 const progress=[],recognitions=[],rates=[];let cleaned=false;
 const Provider=new Function('narrationRateForRepair','alignRecordedNarration','measureNarrationCaptions','configuredNarrationProvider','EDGE_TTS_VOICES','generateEdgeTTS','uploadLessonMediaBuffer','execute','mkdtemp','writeFile','readFile','rm','tmpdir','join','reportCourseProgress',source+'\nreturn UltimatePlatformNarration;')(
  narrationRateForRepair,async(_file,text)=>{if(alignmentError)throw alignmentError;return text.split(' ').map((word,i)=>({word,start:i*.2,end:(i+1)*.2}));},
  async(bytes,text,duration,receive)=>{recognitions.push({bytes,text,duration});if(recognizerError)throw recognizerError;
   const words=text.split(' ').map((word,i)=>({word,start:i*.2,end:(i+1)*.2}));receive(words);
   return [{text,startSeconds:words[0].start,endSeconds:words.at(-1).end}];
  },()=> 'kokoro',{warm:'test-warm-voice'},async(_text,options)=>{assert.equal(options.voice,'test-warm-voice');rates.push(options.rate);if(fail)throw Error('TTS_FAILED');return Buffer.alloc(10);},async()=> 'https://media.example/audio.mp3',
  async()=>({stdout:'1'}),async()=>'/tmp/narration',async()=>{},async()=>Buffer.alloc(10),async()=>{cleaned=true;},()=>'/tmp',(...parts)=>parts.join('/'),
  (phase,completed,total)=>progress.push({phase,completed,total}));
 return{provider:new Provider(),progress,recognitions,rates,cleaned:()=>cleaned};
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

test('an absent grammar path uses independent measured timings from the same recording',async()=>{
 const h=harness(false,{alignmentError:new Error('FORCED_ALIGNMENT_NO_PATH')});
 const result=await h.provider.generate(input),segment=result.segments[0];
 assert.deepEqual(h.recognitions.map(r=>r.text),['Primary recording','Fresh recap']);
 assert.ok(h.recognitions.every(r=>Buffer.isBuffer(r.bytes)&&r.duration===1));
 assert.deepEqual(segment.wordAlignment.map(w=>w.start),[0,.2,1,1.2]);
 assert.deepEqual(segment.captions.map(c=>c.startSeconds),[0,1]);assert.equal(h.cleaned(),true);
});

test('a failed independent measurement cannot become synthetic captions or a completed segment',async()=>{
 const h=harness(false,{alignmentError:new Error('FORCED_ALIGNMENT_NO_PATH'),recognizerError:new Error('ULTIMATE_RECOGNIZED_WORD_TIMINGS_REQUIRED')});
 await assert.rejects(h.provider.generate(input),/RECOGNIZED_WORD_TIMINGS_REQUIRED/);
 assert.equal(h.recognitions.length,1);assert.ok(!h.progress.some(p=>p.phase==='narration:stored-segments'));assert.equal(h.cleaned(),true);
});

test('other alignment and timestamp errors retain their original failure',async()=>{
 const h=harness(false,{alignmentError:new Error('FORCED_ALIGNMENT_INVALID_MEASURED_TIME')});
 await assert.rejects(h.provider.generate(input),/INVALID_MEASURED_TIME/);assert.equal(h.recognitions.length,0);
});

test('the actual Python decoder reports a missing grammar path without inventing timing data',()=>{
 const program=`import sys,types,runpy,io,subprocess,builtins
path=sys.argv[1]
class Decoder:
 def __init__(self,**kwargs): pass
 def set_align_text(self,text): pass
 def start_utt(self): pass
 def process_raw(self,pcm,**kwargs): pass
 def end_utt(self): pass
 def seg(self): return None
sys.modules['pocketsphinx']=types.SimpleNamespace(Decoder=Decoder)
sys.modules['alignment_lexicon']=types.SimpleNamespace(install_pronunciations=lambda *args:None)
builtins.open=lambda *args,**kwargs:io.StringIO('Primary recording')
subprocess.check_output=lambda *args,**kwargs:b'\\0'*32000
sys.argv=[path,'fixture.wav','fixture.txt']
try: runpy.run_path(path,run_name='__main__')
except ValueError as error:
 assert str(error)=='FORCED_ALIGNMENT_NO_PATH',str(error)
 print('missing path classified; no timestamps produced')
else: raise AssertionError('missing alignment was accepted')`;
 const output=execFileSync('python3',['-c',program,fileURLToPath(new URL('../../lib/video/forced-alignment.py',import.meta.url))],{encoding:'utf8'});
 assert.equal(output.trim(),'missing path classified; no timestamps produced');
});

test('typographic possessives retain one spoken word in the actual alignment grammar',()=>{
 const program=`import sys,types,runpy,io,subprocess,builtins
path=sys.argv[1]
class Decoder:
 def __init__(self,**kwargs): pass
 def set_align_text(self,text): assert text=="obtain the client's agreement",text
 def start_utt(self): pass
 def process_raw(self,pcm,**kwargs): pass
 def end_utt(self): pass
 def seg(self): return [types.SimpleNamespace(word=w,start_frame=i*20,end_frame=i*20+19) for i,w in enumerate(["obtain","the","client's","agreement"])]
sys.modules['pocketsphinx']=types.SimpleNamespace(Decoder=Decoder)
sys.modules['alignment_lexicon']=types.SimpleNamespace(install_pronunciations=lambda *args:None)
builtins.open=lambda *args,**kwargs:io.StringIO('Obtain the client’s agreement.')
subprocess.check_output=lambda *args,**kwargs:b'\\0'*32000
sys.argv=[path,'fixture.wav','fixture.txt']
runpy.run_path(path,run_name='__main__')`;
 const output=execFileSync('python3',['-c',program,fileURLToPath(new URL('../../lib/video/forced-alignment.py',import.meta.url))],{encoding:'utf8'});
 const words=JSON.parse(output);assert.equal(words.length,4);assert.equal(words[2].word,"client's");assert.equal(words[2].start,.4);
});

test('a grammar word mismatch requires an independent measurement of the same recording',async()=>{
 const h=harness(false,{alignmentError:new Error('FORCED_ALIGNMENT_SCRIPT_MISMATCH')});
 const result=await h.provider.generate(input);
 assert.equal(h.recognitions.length,2);
 assert.ok(h.recognitions.every(r=>Buffer.isBuffer(r.bytes)&&r.duration===1));
 assert.deepEqual(result.segments[0].wordAlignment.map(w=>w.start),[0,.2,1,1.2]);
});
test('grammar mismatch cannot hide a failed independent speech measurement',async()=>{
 const h=harness(false,{alignmentError:new Error('FORCED_ALIGNMENT_SCRIPT_MISMATCH'),recognizerError:new Error('ULTIMATE_RECOGNIZED_WORD_TIMINGS_REQUIRED')});
 await assert.rejects(h.provider.generate(input),/RECOGNIZED_WORD_TIMINGS_REQUIRED/);
 assert.ok(!h.progress.some(p=>p.phase==='narration:stored-segments'));
});

test('measured slow speech regenerates every part at a bounded native rate and realigns it',async()=>{
 const h=harness();
 const repairDirective={target:'natural_narration',previous:{narration:{rate:'0%'}},requirements:[{code:'PACE_OUT_OF_RANGE',message:'Delivered narration failed PACE_OUT_OF_RANGE: '+JSON.stringify({metrics:{wordsPerMinute:{value:107.988,measured:true}}})}]};
 const result=await h.provider.generate({...input,targetWpm:135,repairDirective});
 assert.deepEqual(h.rates,['+15%','+15%']);
 assert.equal(result.rate,'+15%');
 assert.equal(h.progress.filter(p=>p.phase.startsWith('narration:alignment')).length,2);
});
