#!/usr/bin/env node
/**
 * Read-only launch gate. Accepts a verified production evidence snapshot.
 * No network calls, job mutations, worker restarts, PR merges or deployments.
 *
 * Usage: node scripts/operations/assess-production-readiness.mjs evidence.json
 * Evidence must be captured by authorized read-only integrations; never infer
 * runtime health from repository code or an unverified snapshot.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const REQUIRED = ['capturedAt', 'source', 'deployment', 'jobs', 'monitoring', 'publication', 'learnerAcceptance'];

export function assess(snapshot, now = new Date()) {
  const findings = [];
  if (!snapshot || typeof snapshot !== 'object' || REQUIRED.some(k => !(k in snapshot))) {
    return { status: 'BLOCKED', findings: ['Missing required evidence sections'], permittedAutomatedActions: ['notify'] };
  }
  const add = (message) => findings.push(message);
  const age = now.getTime() - Date.parse(snapshot.capturedAt);
  if (!Number.isFinite(age) || age < -300000 || age > 30 * 60 * 1000) add('Production evidence missing, stale, or future-dated');
  if (snapshot.source !== 'verified-runtime-readonly') add('Evidence not verified from runtime read-only sources');
  if (snapshot.deployment?.verifiedCloudRunDigest !== true || !snapshot.deployment?.imageDigest) add('No independently verified Cloud Run worker image digest');
  if (snapshot.deployment?.productionAcceptancePassed !== true) add('Production acceptance has not passed');
  const jobs = snapshot.jobs;
  for (const key of ['failed', 'queued', 'running', 'completed']) {
    if (!Number.isInteger(jobs?.[key]) || jobs[key] < 0) add('Invalid job count: ' + key);
  }
  if (jobs?.failed > 0) add('Failed jobs require reconciliation');
  if (jobs?.staleHeartbeatCount !== 0) add('Running worker heartbeat not verified healthy');
  if (jobs?.overdueEligibleCount !== 0) add('Eligible jobs overdue or queue state unknown');
  if (jobs?.unexplainedCompletedReversals !== 0) add('Completed-job reversals require investigation');
  if (jobs?.unauthorizedOwnerPauseCount !== 0) add('Unverified owner pause flags present');
  if (snapshot.monitoring?.allUnresolvedJobsCovered !== true) add('PARIS monitoring does not cover all unresolved jobs');
  if (snapshot.publication?.canonicalMismatchCount !== 0) add('Canonical publication records do not reconcile');
  if (snapshot.learnerAcceptance?.passed !== true) add('Authenticated learner-facing acceptance not passed');
  return {
    status: findings.length ? 'BLOCKED' : 'READY_FOR_HUMAN_RELEASE_APPROVAL',
    findings,
    permittedAutomatedActions: ['observe', 'correlate', 'notify', 'open-draft-pr', 'run-isolated-tests'],
    prohibitedWithoutApproval: ['alter-job-status', 'override-owner-pause', 'restart-leased-worker', 'change-publication', 'merge-to-main', 'production-deploy']
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) {
    console.error('Usage: node scripts/operations/assess-production-readiness.mjs evidence.json');
    process.exitCode = 2;
  } else {
    try {
      const result = assess(JSON.parse(readFileSync(process.argv[2], 'utf8')));
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      if (result.status === 'BLOCKED') process.exitCode = 1;
    } catch (err) {
      console.error('Evidence unreadable: ' + err.message);
      process.exitCode = 2;
    }
  }
}
