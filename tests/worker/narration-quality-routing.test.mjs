import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const strip=path=>stripTypeScriptTypes(readFileSync(new URL(path,import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
const evaluateNarration=new Function(strip('../../lib/ultimate-course-builder/quality/narration-quality.ts')+';return evaluateNarration;')();
const routeSelectiveRepairs=new Function(strip('../../lib/ultimate-course-builder/core/repair-router.ts')+';return routeSelectiveRepairs;')();
const source=strip('../../lib/ultimate-course-builder/core/production-handlers.ts');
function metrics(wpm){
 const measured=value=>({measured:true,value});
 return {wordsPerMinute:measured(wpm),roboticScore:measured(0),monotoneScore:measured(0),clippedWords:measured(0),unnaturalPauseCount:measured(0),pronunciationFailures:measured([]),repeatedAudioRatio:measured(0),durationSeconds:measured(60)};
}
async function inspect(wpm){
 const createHandlers=new Function('evaluateNarration','analyzeNarrationAudio','renderMediaUrl',source+';return createProductionHandlers;')(evaluateNarration,async()=>metrics(wpm),()=> 'https://media.example/film.mp4');
 return createHandlers({}).narration_qa({artifacts:{lesson_film_render:{render:{}},finished_media_qa:{mediaQA:{inspection:{actualTranscript:'Delivered teaching',mediaSha256:'measured-sha'}}}}});
}
test('failed delivered narration exposes the measured defect to the correct repair producer',async()=>{
 const result=await inspect(170);
 assert.equal(result.passed,false);
 assert.deepEqual(result.findings.map(f=>f.code),['PACE_OUT_OF_RANGE']);
 assert.match(result.findings[0].message,/170/);
 assert.equal(routeSelectiveRepairs(result.findings)[0].step,'natural_narration');
 assert.equal(result.artifacts.narrationQA.mediaSha256,'measured-sha');
});
test('passing narration retains measured evidence and has no repair findings',async()=>{
 const result=await inspect(130);
 assert.equal(result.passed,true);
 assert.deepEqual(result.findings,[]);
 assert.equal(result.artifacts.narrationQA.source,'delivered-mp4');
});
