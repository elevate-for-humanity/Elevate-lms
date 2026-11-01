import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

function load(source, name, args = {}) {
  const js = stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm, ''), { mode: 'transform' })
    .replaceAll('export async function', 'async function').replaceAll('export function', 'function');
  return new Function(...Object.keys(args), js + '; return ' + name)(...Object.values(args));
}
const helper = readFileSync(new URL('../../lib/program-holder/syllabus-course.ts', import.meta.url), 'utf8');
const plan = load(helper, 'holderSyllabusPlan');
test('preserves the entire syllabus with bounded sections and rejects empty/oversized source', () => {
  const text = Array.from({length: 300}, (_, i) => 'Section ' + i + ': learning requirements and complete source content.').join('\n');
  const result = plan(text);
  assert.equal(result.modules.map(m => m.lessons[0].content).join(''), text);
  assert.ok(result.modules.every(m => m.lessons[0].content.length <= 4000));
  assert.throws(() => plan('short'));
  assert.throws(() => plan('x'.repeat(250001)));
});
test('a supplemental course cannot replace primary training', () => {
  const source = readFileSync(new URL('../../lib/learner/training-enrollment.ts', import.meta.url), 'utf8');
  const select = load(source, 'selectTrainingEnrollment');
  const primary = {source_table:'program_enrollments', course_id:'primary', status:'active'};
  const secondary = {source_table:'course_enrollments', course_id:'secondary', status:'active', assignment_kind:'secondary'};
  assert.equal(select([secondary, primary]), primary);
  assert.equal(select([secondary]), null);
});
function fakeDb(responses) {
  const calls = [];
  return { calls, from(table) {
    const call = {table, operations:[]}; calls.push(call);
    const result = responses.shift();
    const query = new Proxy({}, { get(_, key) {
      if (key === 'then') return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
      return (...args) => { call.operations.push([key, ...args]); return query; };
    }});
    return query;
  }};
}
test('secondary assignment is scoped to active holder AND program and never overwrites an existing enrollment', async () => {
  const sync = load(helper, 'syncHolderSecondaryAssignments');
  const db = fakeDb([
    {data:[{program_holder_id:'holder-a',program_id:'program-a'}]},
    {data:[]}, {data:[{id:'course-a'}]}, {data:[]},
  ]);
  await sync(db, 'student-a');
  assert.ok(db.calls[0].operations.some(op => op[0] === 'is' && op[1] === 'revoked_at' && op[2] === null));
  assert.ok(db.calls[2].operations.some(op => op[0] === 'contains' && op[2].program_holder_id === 'holder-a' && op[2].holder_program_id === 'program-a'));
  assert.ok(db.calls[2].operations.some(op => op[0] === 'eq' && op[1] === 'generation_progress' && op[2] === 100));
  const upsert = db.calls[3].operations.find(op => op[0] === 'upsert');
  assert.equal(upsert[1][0].student_id, 'student-a');
  assert.equal(upsert[2].ignoreDuplicates, true);
});
test('ending a placement revokes its automatic secondary assignment without creating a replacement', async () => {
  const sync = load(helper, 'syncHolderSecondaryAssignments');
  const db = fakeDb([{data:[]}, {data:[{id:'old',assignments:'holder_syllabus:holder-a:program-a'}]}, {data:[]}]);
  await sync(db, 'student-a');
  const update = db.calls[2].operations.find(op => op[0] === 'update');
  assert.equal(update[1].status, 'revoked');
  assert.ok(update[1].revoked_at);
  assert.equal(db.calls.length, 3);
});
test('retry rejects a course belonging to a different holder', async () => {
  const start = load(helper, 'startHolderSyllabus');
  const db = fakeDb([{data:[]}, {data:{id:'document-a',metadata:{program_holder_id:'other',syllabus_document_id:'document-a'}}}]);
  await assert.rejects(() => start(db, {
    documentId:'document-a',holderId:'holder-a',programId:'program-a',actorId:'actor',
    title:'Syllabus', text:'Complete authorized syllabus instruction. '.repeat(8), storagePath:'protected/file.pdf',
  }), /identity/);
});
