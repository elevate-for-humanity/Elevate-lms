import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync(new URL('../../apps/lms/app/api/program-holder/documents/route.ts', import.meta.url),'utf8');
const form = readFileSync(new URL('../../components/program-holder/ProgramHolderDocumentUpload.tsx', import.meta.url),'utf8');

test('text-only syllabus is persisted through one private PDF upload path', () => {
  assert.equal((route.match(/const inlineSyllabus =/g) || []).length,1);
  assert.match(route,/inlineSyllabus && \(\!\(file instanceof File\) \|\| file\.size === 0\)/);
  assert.match(route,/suppliedText\.length < 100 \|\| suppliedText\.length > 250000/);
  assert.match(route,/new File\(\[pdf\.output\('arraybuffer'\)\]/);
  assert.match(route,/\.from\('documents'\)\s*\.upload\(path,/);
  assert.match(route,/\.from\('program_holder_documents'\)\s*\.insert\(/);
  assert.match(route,/ocr_text: isSyllabus \? syllabusText : null/);
  assert.match(route,/\.from\('documents'\)\.remove\(\[path\]\)/);
});

test('source upload persists even when a secondary builder start fails', () => {
  assert.match(route,/return NextResponse\.json\(\{ document: data, buildStarted: false,/);
  assert.match(form,/if \(isSyllabus && data\.buildStarted !== true\)/);
  assert.match(form,/if \(!data\.document\?\.id\)/);
  assert.match(form,/Syllabus saved\. Course Builder did not start/);
  assert.match(form,/window\.setTimeout\(\(\) => window\.location\.reload\(\), 1800\)/);
});

test('program assignment and authenticated holder scope remain required', () => {
  assert.match(route,/requireProgramHolder\(\{ allowPendingApproval: true \}\)/);
  assert.match(route,/ctx\.mode !== 'holder'/);
  assert.match(route,/!ctx\.programIds\.includes\(programId\)/);
  assert.match(route,/startHolderSyllabus\(ctx\.db,/);
});
