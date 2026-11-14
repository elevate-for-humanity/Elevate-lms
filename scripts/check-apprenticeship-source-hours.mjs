#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../lib/compliance/appendix-a-standards.ts', import.meta.url), 'utf8');
const expected = { barber: [14,260], esthetician: [20,300], manicurist: [19,210] };
let checked=0;
for (const match of source.matchAll(/\n  (barber|esthetician|manicurist): \{\n([\s\S]*?)\n  \},/g)) {
  const [,key,body]=match;
  const declared=Number(body.match(/relatedInstructionHours:\s*(\d+)/)?.[1]);
  const list=body.match(/relatedInstruction:\s*\[([\s\S]*?)\n    \]/)?.[1];
  const competencies=body.match(/competencies:\s*\[([\s\S]*?)\n    \]/)?.[1];
  assert.ok(list && competencies, key+' source lists missing');
  const hours=[...list.matchAll(/hours:\s*(\d+)/g)].map(m=>Number(m[1]));
  const ids=[...competencies.matchAll(/id:\s*'([^']+)'/g)].map(m=>m[1]);
  assert.equal(hours.reduce((a,b)=>a+b,0),declared,key+' subject-hour sum differs from declared total');
  assert.equal(declared,expected[key][1],key+' differs from signed July 10 source');
  assert.equal(ids.length,expected[key][0],key+' competency count');
  assert.equal(new Set(ids).size,ids.length,key+' duplicate competency IDs');
  console.log(key+': '+declared+' RTI hours; '+ids.length+' unique competencies');
  checked++;
}
assert.equal(checked,3,'Expected all three approved occupation source blocks');
console.log('Approved-source hour and competency consistency passed.');
