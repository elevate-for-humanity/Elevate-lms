import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {saveCourseEdit,validateCourseEdit,draftLessonHtml} from '../../lib/course-builder/workspace-edit.mjs';
import {courseResultId,courseResultLessonId} from '../../lib/course-builder/workspace-receipt.mjs';
import {loadCheckpointPage} from '../../lib/ultimate-course-builder/queries/checkpoint-page.mjs';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function compile(path,names=[],values=[]){
 let source=readFileSync(new URL('../../'+path,import.meta.url),'utf8');
 source=stripTypeScriptTypes(source).replace(/^import .*;\n/gm,'').replace(/export /g,'');
 return new Function(...names,source+';return typeof planAIToolFromCommand!=="undefined"?planAIToolFromCommand:typeof decomposePlan!=="undefined"?decomposePlan:{isReadOnlyRequest,affirmativeActionText,prohibitsToolUse};')(...values);
}
const intent=compile('lib/ai/command-intent.ts');
const plan=compile('lib/ai/tools/planner.ts',['getAITool','isReadOnlyRequest'],[()=>null,intent.isReadOnlyRequest]);
const decompose=compile('lib/platform/planner.ts',['buildUnifiedEngineeringStages','affirmativeActionText','isReadOnlyRequest','prohibitsToolUse'],[
 ()=>[{id:'engineering',title:'Engineering',command:'code work',runner:'OPENHANDS',dependsOn:[],maxAttempts:1}],intent.affirmativeActionText,intent.isReadOnlyRequest,intent.prohibitsToolUse]);
const context=JSON.stringify({workspace:'course',courseId:id(1),lessonId:id(2),buildId:id(3),title:'Complete Lesson Build'});
test('lesson edits route to the scoped editor with exact selected identities',()=>{
 const result=plan('Rewrite the introduction to explain sanitation.\n\n'+context);
 assert.equal(result.name,'courses.edit');assert.equal(result.input.courseId,id(1));assert.equal(result.input.lessonId,id(2));
 assert.equal(result.input.goal.trim(),'Rewrite the introduction to explain sanitation.');
});
test('workspace titles cannot turn lesson changes into repository engineering',()=>{
 const steps=decompose('Change the lesson introduction.\n\n'+context).steps;
 assert.equal(steps.length,1);assert.match(steps[0].command,/introduction/);assert.notEqual(steps[0].runner,'OPENHANDS');
});
test('explicit code work still uses engineering planning',()=>{
 const steps=decompose('Change the TypeScript component code.\n\n'+context).steps;
 assert.equal(steps[0].runner,'OPENHANDS');
});
test('read-only course audits do not edit or queue work',()=>{
 const result=plan('Audit the course status; do not change anything.\n\n'+context);
 assert.equal(result.name,'courses.status');assert.equal(result.input.courseId,id(1));
});
test('publish uses the selected accepted build and existing release endpoint',()=>{
 assert.deepEqual(plan('Publish this course.\n\n'+context),{name:'courses.publish',input:{buildId:id(3)}});
});
test('receipts navigate only from successful explicit course identities',()=>{
 assert.equal(courseResultId({payload:{ok:true,courseId:id(1),lessonId:id(2)}}),id(1));
 assert.equal(courseResultLessonId({payload:{ok:true,courseId:id(1),lessonId:id(2)}}),id(2));
 assert.equal(courseResultId({ok:false,courseId:id(1)}),null);
 assert.equal(courseResultId({input:{courseId:id(1)}}),null);
 assert.equal(courseResultId('Ask to open '+id(1)),null);
});
test('AI patch validator rejects identity, publication and unsupported field changes',()=>{
 for(const patch of [{course:{id:id(5)}},{lesson:{status:'published'}},{course:{title:''}},{course:{title:'valid'},publish:true}])
  assert.throws(()=>validateCourseEdit(patch,true));
 assert.throws(()=>validateCourseEdit({lesson:{content:'new instruction'}},false),/SELECT_LESSON/);
});
function editDb({failLessons=false}={}){
 const calls=[];
 const db={from(table){let operation,body,filters=[];
  const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},contains(){return q;},insert(value){operation='insert';body=value;return q;},update(value){operation='update';body=value;return q;},
   maybeSingle:async()=>({data:null,error:null}),
   single:async()=>{calls.push({table,operation,body,filters});return {data:{id:body?.id??filters.find(([k])=>k==='id')?.[1]},error:null};},
   then(resolve){calls.push({table,operation,body,filters});return Promise.resolve({data:null,error:failLessons&&table==='course_lessons'?Error('COPY_FAILED'):null}).then(resolve);}};
  return q;
 }};
 return {db,calls};
}
function revisionFixture(options){
 const f=editDb(options);let n=10;
 return {...f,sourceCourse:{id:id(1),status:'published',title:'Cosmetology',slug:'cosmetology',metadata:{existing:true}},
  sourceModules:[{id:id(3),title:'Module',slug:'module',order_index:1}],
  sourceLessons:[{id:id(2),module_id:id(3),title:'Original',content:'Original instruction',content_json:{film:{videoUrl:'https://example.com/old.mp4'},mediaAttachment:{sourceLessonBuildId:'old'},experience:{knowledgeChecks:[{question:'retained'}]}},video_url:'https://example.com/old.mp4'}],
  lessonId:id(2),patch:{lesson:{content:'Updated sanitation instruction'}},actorId:id(5),requestId:id(6),uuid:()=>id(n++)};
}
test('published lesson edits create a distinct complete draft and never update original rows',async()=>{
 const f=revisionFixture();const result=await saveCourseEdit(f);
 assert.notEqual(result.courseId,id(1));assert.notEqual(result.lessonId,id(2));assert.equal(result.requiresBuild,true);
 for(const call of f.calls.filter(c=>c.operation==='update'))assert.ok(!call.filters.some(([k,v])=>k==='id'&&v===id(1)));
 const lessons=f.calls.find(c=>c.table==='course_lessons'&&c.operation==='insert').body;
 assert.equal(lessons[0].content,'Updated sanitation instruction');assert.equal(lessons[0].video_url,null);
 assert.equal(lessons[0].is_published,false);assert.equal(lessons[0].approved,false);
 assert.equal(lessons[0].content_json.film,undefined);
 assert.equal(lessons[0].content_json.experience.knowledgeChecks[0].question,'retained');
 assert.ok(f.calls.some(c=>c.table==='courses'&&c.operation==='update'&&c.body.metadata.course_ai_edit_complete));
});
test('a partial draft copy cannot report success or modify the publication',async()=>{
 const f=revisionFixture({failLessons:true});
 await assert.rejects(saveCourseEdit(f),/COPY_FAILED/);
 assert.ok(!f.calls.some(c=>c.operation==='update'));
});
test('a lesson outside the selected course is rejected before any write',async()=>{
 const f=revisionFixture();f.lessonId=id(99);
 await assert.rejects(saveCourseEdit(f),/LESSON_NOT_IN_SELECTED_COURSE/);
 assert.equal(f.calls.length,0);
});
test('checkpoint polling returns all canonical lessons without producer artifacts or version scans',async()=>{
 const selections=[],tables=[];
 const build={id:id(8),course_id:id(1),profile:{competencies:[{id:'first'},{id:'second'}],canonicalLessonIds:{first:id(2),second:id(4)}}};
 const db={from(table){tables.push(table);let fields;const q={select(v){fields=v;selections.push(v);return q;},eq(){return q;},order(){return q;},single:async()=>({data:build,error:null}),then(resolve){return Promise.resolve({data:table==='course_lessons'?[{id:id(2),title:'First',is_published:true,video_url:'https://example.com/film.mp4'},{id:id(4),title:'Second',is_published:true,video_url:'https://example.com/second.mp4'}]:[{id:id(9),competency_id:'first',status:'built'}],error:null}).then(resolve);}};return q;}};
 const result=await loadCheckpointPage(db,id(8));assert.equal(result.ultimate_lesson_builds.length,2);
 assert.equal(result.ultimate_lesson_builds[1].hasCheckpoint,false);
 assert.ok(result.ultimate_lesson_builds.every(row=>row.preview.videoUrl));
 assert.ok(selections.every(s=>!s.includes('artifacts')));assert.ok(!tables.includes('ultimate_artifact_versions'));
});

test('deploy commands map to the live Studio shell with its required production confirmation',()=>{
 const result=plan('Deploy Admin.');
 assert.equal(result.name,'deployments.autopilot');assert.equal(result.input.workflow,'deploy-admin');
 assert.equal(result.input.confirmation,'CONFIRM DEPLOY');
});

test('workflow discovery terminates after raw pages even when retired workflows are removed',async()=>{
 let pages=0,headers=0;
 let source=stripTypeScriptTypes(readFileSync(new URL('../../apps/admin/app/api/admin/dev-studio/shell/route.ts',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/export /g,'');
 const fakeFetch=async()=>{pages++;if(pages>3)throw Error('PAGINATION_DID_NOT_TERMINATE');
  return {ok:true,json:async()=>({total_count:201,workflows:Array.from({length:pages===3?1:100},(_,i)=>({id:(pages-1)*100+i,state:'active',path:pages===1&&i===0?'.github/workflows/build-cosmetology-course.yml':'.github/workflows/current-'+pages+'-'+i+'.yml'}))})};};
 const api=new Function('studioRepository','getGitHubHeaders','fetch',source+';return {listDispatchableWorkflows,branch};')(
  ()=> 'owner/repo',async()=>{headers++;return {Authorization:'Bearer fixture'};},fakeFetch);
 const workflows=await api.listDispatchableWorkflows();
 assert.equal(pages,3);assert.equal(workflows.length,200);assert.equal(headers,3);assert.equal(api.branch(),'main');
});

test('AI lesson text is safely rendered instead of becoming executable HTML',()=>{
 const html=draftLessonHtml('<script>alert(1)</script>\n\nNew lesson');
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('<p>New lesson</p>'));
});

test('a scoped course status plan retains the selected course context',()=>{
 const goal='Check the selected course status; do not change anything.\n\n'+context;
 const steps=decompose(goal).steps;assert.equal(steps.length,1);assert.equal(steps[0].command,goal);
 assert.equal(plan(steps[0].command).input.courseId,id(1));
});
