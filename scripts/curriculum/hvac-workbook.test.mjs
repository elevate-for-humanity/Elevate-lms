import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const content=JSON.parse(read('lib/lms/hvac-workbook-content.json'));
const bank=JSON.parse(read('lib/lms/hvac-practice-bank.json'));
const contract=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(read('lib/lms/hvac-workbook-contract.ts'))).toString('base64'));
const ids=content.chapters.map(chapter=>chapter.section_id);
const good=ids.map(section_id=>({section_id,reviewed:true,answers:Object.fromEntries(contract.HVAC_RESPONSE_FIELDS.map(key=>[key,'My explained calculation and supporting reasoning.']))}));

test('all 17 chapters have substantial teaching, their exact activities, and a real illustration',()=>{
 assert.equal(content.chapters.length,17);assert.equal(new Set(ids).size,17);
 for(const chapter of content.chapters){assert.equal(chapter.prompts.length,3);assert.ok(chapter.lessons.length);assert.ok(chapter.text.length>500);assert.ok(chapter.example.length>100);assert.ok(chapter.image?.startsWith('/images/workbooks/hvac/'));assert.ok(existsSync(new URL('public'+chapter.image,root)));assert.ok(existsSync(new URL(`public/images/workbooks/hvac/chapter-${chapter.number}.svg`,root)));}
});
test('practice bank has four distinct balanced 25-question sections with valid authored keys',()=>{
 assert.equal(bank.length,4);assert.equal(new Set(bank.flatMap(section=>section.questions.map(question=>question.id))).size,100);
 for(const section of bank){assert.equal(section.questions.length,25);assert.equal(new Set(section.questions.map(question=>question.question)).size,25);for(const q of section.questions){assert.ok(q.options.length>=3);assert.equal(new Set(q.options).size,q.options.length);assert.ok(Number.isInteger(q.correctAnswer)&&q.correctAnswer>=0&&q.correctAnswer<q.options.length);assert.ok(q.explanation.length>20);}}
});
test('no response, blank field, unreviewed chapter, or duplicate section can satisfy workbook completion',()=>{
 assert.equal(contract.evaluateHvacWorkbookResponses(ids,[]).complete,false);
 assert.equal(contract.evaluateHvacWorkbookResponses(ids,good).complete,true);
 for(const field of contract.HVAC_RESPONSE_FIELDS){const rows=structuredClone(good);rows[5].answers[field]='   ';assert.equal(contract.evaluateHvacWorkbookResponses(ids,rows).complete,false);}
 const unreviewed=structuredClone(good);unreviewed[0].reviewed=false;assert.equal(contract.evaluateHvacWorkbookResponses(ids,unreviewed).complete,false);
 assert.equal(contract.evaluateHvacWorkbookResponses([...ids.slice(1),ids[1]],good).complete,false);
});
test('another learner or unrelated section responses cannot fill missing assigned work',()=>{
 const unrelated=good.map(row=>({...row,section_id:'not-assigned-'+row.section_id}));
 assert.equal(contract.evaluateHvacWorkbookResponses(ids,unrelated).completed,0);
 assert.equal(contract.evaluateHvacWorkbookResponses(ids,good.slice(0,16)).complete,false);
});

let helper=stripTypeScriptTypes(read('lib/lms/hvac-workbook-completion.ts'));
helper=helper.replace(/^import[^\n]*\n/gm,'');
const helperModule=await import('data:text/javascript;base64,'+Buffer.from(`const content=${JSON.stringify(content)};const {HVAC_COURSE_ID,HVAC_WORKBOOK_SLUG,HVAC_PRACTICE_LESSONS,evaluateHvacWorkbookResponses}=await import(${JSON.stringify('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(read('lib/lms/hvac-workbook-contract.ts'))).toString('base64'))});\n`+helper).toString('base64'));
function dbFixture({responses=good,passes=4,active=true,wrongLink=false}={}){
 const tables={digital_workbooks:[{id:'book',slug:content.workbookSlug,is_active:active}],digital_workbook_sections:content.chapters.map(ch=>({id:ch.section_id,workbook_id:'book',lesson_id:wrongLink?'wrong':ch.lesson_id})),digital_workbook_responses:responses.map(row=>({...row,user_id:'learner'})),course_lessons:contract.HVAC_PRACTICE_LESSONS.map(row=>({...row,course_id:content.courseId,is_published:true,is_required:true,lesson_type:'quiz',passing_score:80,quiz_questions:Array(25).fill({})})),checkpoint_scores:contract.HVAC_PRACTICE_LESSONS.slice(0,passes).map(row=>({lesson_id:row.id,user_id:'learner',course_id:content.courseId,passed:true,score:80}))};
 return {from(table){let rows=tables[table]||[];const q={select(){return q},eq(key,value){rows=rows.filter(row=>row[key]===value);return q},gte(key,value){rows=rows.filter(row=>row[key]>=value);return q},in(key,values){rows=rows.filter(row=>values.includes(row[key]));return q},maybeSingle(){return Promise.resolve({data:rows[0]||null,error:null})},then(resolve,reject){return Promise.resolve({data:rows,error:null}).then(resolve,reject)}};return q;}};
}
test('server completion requires all four practice passes as well as all responses',async()=>{
 for(let passes=0;passes<4;passes++)assert.equal((await helperModule.checkHvacWorkbookCompletion(dbFixture({passes}),'learner',content.courseId)).complete,false);
 assert.equal((await helperModule.checkHvacWorkbookCompletion(dbFixture(),'learner',content.courseId)).complete,true);
 assert.equal((await helperModule.checkHvacWorkbookCompletion(dbFixture(),'another-user',content.courseId)).complete,false);
 assert.equal((await helperModule.checkHvacWorkbookCompletion(dbFixture({wrongLink:true}),'learner',content.courseId)).complete,false);
 assert.equal((await helperModule.checkHvacWorkbookCompletion(dbFixture({active:false}),'learner',content.courseId)).complete,false);
});
test('unrelated courses preserve their existing completion behavior',async()=>{
 assert.equal((await helperModule.checkHvacWorkbookCompletion({from(){throw Error('Must not read HVAC records')}},'learner','another-course')).complete,true);
});
