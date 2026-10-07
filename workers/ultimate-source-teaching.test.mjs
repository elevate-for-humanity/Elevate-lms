import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const data = value => `data:text/javascript;base64,${Buffer.from(value).toString('base64')}`;
const sequence = data(stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/instructional/teaching-sequence.ts', import.meta.url), 'utf8')));
const source = stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/instructional/source-teaching.ts', import.meta.url), 'utf8')).replace("'./teaching-sequence'", JSON.stringify(sequence));
const {sourceTeaching,narrationChunks,spokenText} = await import(data(source));
test('narrates the complete HTML lesson and its actual questions without JSON or authoring labels',()=>{
 const text='Lesson: Example\nAuthorized course content: '+JSON.stringify({html:'<h1>Tool care</h1><p>Clean tools before disinfection.</p><p>Follow the product label for contact time.</p>',experience:{glossary:[{term:'Contact time',definition:'Time a surface must remain wet.'}],knowledgeChecks:[{question:'What determines contact time?',options:['The label','The clock color','The room size'],correct:0,explanation:'Follow the product label.'}]}});
 const result=sourceTeaching([{id:'x',text}],'Tool care');
 assert.match(result.stageText.concept_explanation,/Follow the product label for contact time/);
 assert.match(result.stageText.terminology,/must remain wet/);
 assert.equal(result.questions[0].correct,0);
 assert.match(result.stageText.knowledge_check,/What determines contact time/);
 assert.doesNotMatch(Object.values(result.stageText).join(' '),/Authorized course content|<p>|"html"/);
});
test('retains later procedures and safety from every complete registered trade lesson',()=>{
 const long='Background information. '.repeat(80);
 const text=`Module: Tools\nLesson: Clippers\nObjective: Use tools\nAuthorized content: Overview ${long} Procedure Inspect the cable before use. Safety Stop if the cable is damaged.\n\nModule: Tools\nLesson: Shears\nAuthorized content: Overview Choose the appropriate tool. Procedure Cut along the taught guide. Failure Recovery Reassess before removing more hair.`;
 const result=sourceTeaching([{id:'trade',text}],'Tool use');
 assert.match(result.stageText.demonstration,/Inspect the cable/);
 assert.match(result.stageText.demonstration,/Cut along the taught guide/);
 assert.match(result.stageText.mistake_and_correction,/Stop if the cable is damaged/);
 assert.match(result.stageText.mistake_and_correction,/Reassess before removing more hair/);
 assert.doesNotMatch(result.stageText.demonstration,/Module:|Objective:|Authorized content/);
});
test('sentence chunking preserves complete source and bounds ordinary narration work',()=>{
 const text=Array.from({length:100},(_,i)=>`Perform step ${i} safely.`).join(' ');
 const chunks=narrationChunks(text,30);
 assert.equal(chunks.join(' '),text);
 assert(chunks.every(x=>x.split(/\s+/).length<=30));
});
test('malformed transport and absent substantive instruction fail closed',()=>{
 assert.throws(()=>sourceTeaching([{id:'x',text:'Authorized course content: {broken'}],'Title'),/SOURCE_JSON_INVALID/);
 assert.throws(()=>sourceTeaching([{id:'x',text:'Authorized course content: {}'}],'Title'),/SUBSTANTIVE_AUTHORED/);
 assert.equal(spokenText('<script>bad()</script><p>Teach &amp; learn.</p>'),'Teach & learn.');
});
