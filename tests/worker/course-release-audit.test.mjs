import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../../.github/workflows/deploy-google-course-worker.yml',import.meta.url),'utf8');
const job=name=>workflow.split('\n  '+name+':\n')[1]?.split(/\n  [a-z][a-z-]*:\n/)[0];
test('historical media recovery audit runs beside release without replacing required worker acceptance',()=>{
 const build=job('build'),deploy=job('deploy'),audit=job('media-recovery-audit');
 assert.ok(build&&deploy&&audit);
 assert.match(build,/Verify worker boundaries inside the actual photo-capable image/);
 assert.match(build,/Upload immutable worker image/);
 assert.doesNotMatch(build,/COURSE_MEDIA_DEEP_AUDIT/);
 assert.match(deploy,/needs: build/);
 assert.doesNotMatch(deploy,/needs:.*media-recovery-audit/);
 assert.match(deploy,/Deploy three lesson autopilot roles and verify immutable configurations/);
 assert.match(deploy,/Resume repaired saved lessons after verified image deployment/);
 assert.match(audit,/needs: build/);
 assert.match(audit,/COURSE_MEDIA_DEEP_AUDIT=true/);
 assert.match(audit,/audit-course-storage\.ts/);
 assert.doesNotMatch(audit,/continue-on-error/);
});

import { stripTypeScriptTypes } from 'node:module';
const accessibilitySource = stripTypeScriptTypes(
  readFileSync(new URL('../../lib/ultimate-course-builder/accessibility/accessibility-contract.ts', import.meta.url), 'utf8'),
  { mode: 'transform' },
).replaceAll('export ', '');
const { evaluateAccessibility } = new Function(accessibilitySource + '\nreturn { evaluateAccessibility };')();
const observed = { semanticHeadings: true, colorContrast: true, nonColorMeaning: true,
  screenReaderLabels: true, reducedMotion: true };
test('signed browser version metadata does not fail measured accessibility checks', () => {
  assert.deepEqual(evaluateAccessibility({ contractVersion: 'ultimate-lesson-2026-10-29.1', ...observed }),
    { pass: true, critical: false, failures: [] });
});
test('a failed measured check remains a publication blocker with version metadata', () => {
  assert.deepEqual(evaluateAccessibility({ ...observed, contractVersion: 'ultimate-lesson-2026-10-29.1', reducedMotion: false }),
    { pass: false, critical: true, failures: ['ACCESSIBILITY_REDUCEDMOTION_FAILED'] });
});
test('metadata alone and empty evidence cannot authorize release', () => {
  for (const evidence of [{}, { contractVersion: 'ultimate-lesson-2026-10-29.1' }])
    assert.equal(evaluateAccessibility(evidence).pass, false);
});
test('other supplied accessibility checks still fail closed', () => {
  for (const value of [false, undefined, null, 'true', 1])
    assert.equal(evaluateAccessibility({ ...observed, keyboardOperation: value }).pass, false);
});
