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

test('guided and independent practice retain the authored exercise without duplicate narration', async()=>{
 const raw = stripTypeScriptTypes(await readFile(new URL('../lib/video/instructional-quality-gate.ts', import.meta.url), 'utf8'));
 const {instructionalQualityFailures}=await import(data(raw));
 const exercise={title:'Practice infection prevention with assigned sanitation supplies.',instructions:['Inspect the work area and separate clean tools from used equipment.'],expectedArtifact:'A documented sanitation check with the label instruction recorded.'};
 const text='Authorized course content: '+JSON.stringify({
  html:'<p>Use the product label to set the required wet contact time.</p>',
  scenario:'A service area contains one clean station beside a used instrument tray.',
  experience:{
   glossary:[{term:'Sanitation',definition:'Cleaning reduces contaminants before disinfection begins.'}],
   exercises:[exercise],
   practicalTask:'Show the safe cleaning sequence and record which surface was treated.',
   readingGuide:{keyTakeaways:['Maintain separate zones for clean and used equipment throughout the service.']},
   knowledgeChecks:[
    {question:'Which record establishes the required wet contact time?',options:['The product label','The service schedule','The room sign'],correct:0,explanation:"Determine the contact time from the disinfectant manufacturer's approved product label."},
    {question:'How should used implements be handled after the service?',options:['In the designated container','On the clean tray','In a pocket'],correct:0,explanation:'Place used implements in the designated container until the cleaning sequence begins.'},
   ],
  },
 });
 const result=sourceTeaching([{id:'course:practice',text}],'Sanitation');
 assert.match(result.stageText.guided_practice,/Inspect the work area and separate clean tools/);
 assert.match(result.stageText.guided_practice,/A documented sanitation check/);
 assert.match(result.stageText.independent_practice,/without the prompts/);
 const sceneTypes={concept_explanation:'mental_model',instructor_example:'worked_example',knowledge_check:'knowledge_check',recap:'memory_recap'};
 const scenes=result.sequence.map(stage=>({
  dialogue:result.stageText[stage],action:result.stageText[stage],
  requiredVisualEvidence:result.stageText[stage],sceneType:sceneTypes[stage]||'system_diagram',
  shotSize:'close-up',referenceImageUrl:'https://example.com/source.png',
 }));
 const checked=instructionalQualityFailures({courseTitle:'Cosmetology',lessonTitle:'Sanitation',script:scenes.map(s=>s.dialogue).join('\n\n'),storyboard:{scenes},instructor:{id:'ultimate',title:'Instructor',specialty:'Cosmetology'}});
 assert.equal(checked.evidence.repeatedNarrationSegments,0);
 assert.equal(checked.evidence.repeatedSceneDialogues,0);
});

test('duplicate narration repairs the source blueprint rather than rerendering the rejected film',async()=>{
 const raw=stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/core/repair-router.ts',import.meta.url),'utf8'));
 const {routeSelectiveRepairs}=await import(data(raw));
 assert.deepEqual(routeSelectiveRepairs([{step:'finished_media_qa',severity:'error',code:'NARRATION_DUPLICATION',message:'Repeated practice narration'}]),[{step:'learning_objectives',codes:['NARRATION_DUPLICATION'],rebuildOnlyThisStage:true}]);
});
