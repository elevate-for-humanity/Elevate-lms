import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script = readFileSync(new URL('../scripts/check-home-visual-integrity.mjs', import.meta.url), 'utf8');
const functionSource = script.slice(script.indexOf('function auditImageQuality'), script.indexOf("const homepage ="));
function audit(tag) {
 const errors = [];
 const check = vm.runInNewContext(`(${functionSource.trim()})`, {fail: message => errors.push(message)});
 check('fixture.tsx', tag);
 return errors;
}
test('an 80px intrinsic thumbnail requests its actual rendered resolution', () => {
 assert.deepEqual(audit('<Image width={80} height={88} sizes="80px" className="h-[88px] w-20 shrink-0 object-cover" />'), []);
});
test('a full image cannot pass the thumbnail exception by requesting a tiny download', () => {
 for (const tag of [
  '<Image fill sizes="80px" className="object-cover" />',
  '<Image width={1200} height={600} sizes="80px" className="w-full object-cover" />',
  '<Image width={80} height={88} sizes="80px" className="w-full object-cover" />',
 ]) assert.ok(audit(tag).some(message => message.includes('implausibly small')));
});
test('responsive fill images still require dimensions and fitting policy', () => {
 assert.equal(audit('<Image fill />').length, 2);
 assert.deepEqual(audit('<Image fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />'), []);
});
