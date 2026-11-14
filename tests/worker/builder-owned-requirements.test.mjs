import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/instructional/google-lesson-author.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
const bind=new Function(source+'\nreturn bindBlueprintRequirements;')();
test('model does not have to provide a course or requirement ID',()=>{
 const result={blueprint:{objectives:[{id:'o',text:'Teach professionalism'}],segments:[{id:'s',text:'Explain professionalism'}]},grounding:[{sourceId:'course-lesson:reference',excerpt:'Exact source quotation remains unchanged'}]};
 const bound=bind(result,{id:'reference',authorityRequirementIds:[]});
 assert.deepEqual(bound.blueprint.objectives[0].sourceRequirementIds,['course:reference']);
 assert.deepEqual(bound.blueprint.segments[0].sourceRequirementIds,['course:reference']);
 assert.equal(bound.grounding[0].sourceId,'course-lesson:reference');
 assert.equal(bound.blueprint.segments[0].text,'Explain professionalism');
});
test('registered requirement IDs are attached from trusted curriculum, not generated IDs',()=>{
 const result={blueprint:{objectives:[{sourceRequirementIds:['invented']}],segments:[{sourceRequirementIds:['requirement-id']}]}};
 bind(result,{id:'barber-competency',authorityRequirementIds:['registered:guard-control']});
 assert.deepEqual(result.blueprint.objectives[0].sourceRequirementIds,['registered:guard-control']);
 assert.deepEqual(result.blueprint.segments[0].sourceRequirementIds,['registered:guard-control']);
});
test('blocked or missing blueprint is not manufactured into a valid lesson',()=>{
 assert.deepEqual(bind({blocked:true},{id:'x',authorityRequirementIds:[]}),{blocked:true});
});
