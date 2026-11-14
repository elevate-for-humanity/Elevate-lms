import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assess } from './assess-production-readiness.mjs';

const now = new Date('2026-11-04T08:00:00Z');
const passing = () => ({
 capturedAt:'2026-11-04T07:59:00Z', source:'verified-runtime-readonly',
 deployment:{verifiedCloudRunDigest:true,imageDigest:'sha256:test',productionAcceptancePassed:true},
 jobs:{failed:0,queued:0,running:0,completed:1,staleHeartbeatCount:0,overdueEligibleCount:0,unexplainedCompletedReversals:0,unauthorizedOwnerPauseCount:0},
 monitoring:{allUnresolvedJobsCovered:true},
 publication:{canonicalMismatchCount:0}, learnerAcceptance:{passed:true}
});
test('requires valid runtime evidence rather than source-code assertions', () => {
 assert.equal(assess({...passing(),source:'repository-code'}, now).status,'BLOCKED');
});
test('blocks stale evidence and unverified deployment', () => {
 const data=passing(); data.capturedAt='2026-11-03T07:00:00Z'; data.deployment.verifiedCloudRunDigest=false;
 assert.equal(assess(data,now).status,'BLOCKED');
});
test('blocks publication mismatch and queue/heartbeat problems', () => {
 const data=passing(); data.jobs.staleHeartbeatCount=1; data.jobs.overdueEligibleCount=2; data.publication.canonicalMismatchCount=1;
 assert.equal(assess(data,now).findings.length,3);
});
test('never grants production deployment or worker mutations', () => {
 const result=assess(passing(),now);
 assert.equal(result.status,'READY_FOR_HUMAN_RELEASE_APPROVAL');
 assert.ok(!result.permittedAutomatedActions.includes('production-deploy'));
 assert.ok(result.prohibitedWithoutApproval.includes('restart-leased-worker'));
});
test('blocks missing evidence, even if a previous check passed', () => {
 assert.equal(assess({},now).status,'BLOCKED');
});
