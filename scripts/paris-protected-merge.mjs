/**
 * Policy-aware protected-merge driver for a validated PARIS repair PR.
 *
 * Runs inside the signed `paris-protected-merge` workflow. Independent reviews
 * are required only when the authoritative branch policy requires them. An
 * explicit zero-review policy merges without manufacturing an approval.
 *
 * It NEVER weakens a gate: it merges only when the exact validated
 * head still satisfies the repository's required status check and the PR has no
 * outstanding authorized change request. Every precondition failure is reported
 * to the Admin authority and the PR is left untouched.
 *
 * Inputs (env):
 *   PARIS_VERIFIER_TOKEN  - optional merge PAT; required to submit a required review
 *   PARIS_POLICY_TOKEN    - optional policy reader (falls back to the verifier)
 *   GH_TOKEN              - short-lived workflow merge/read token fallback
 *   PARIS_MERGE_CHECK_ONLY - true verifies readiness without GitHub writes
 *   REPAIR_ID, PR_NUMBER, EXPECTED_HEAD_SHA, REPAIR_REPOSITORY
 *   ADMIN_URL             - Admin authority base URL
 *   PARIS_ID_TOKEN        - short-lived signed workflow identity
 */
import { approvalsSatisfied, protectedMergeReadiness, requiredChecksSatisfied } from '../lib/devstudio/openhands/protected-merge-decision.mjs';
import { protectedMainPolicyVerified, requiredMainChecks, requiredMainReviewCount } from '../lib/devstudio/openhands/acceptance-contract.mjs';

const REPOSITORY = process.env.REPAIR_REPOSITORY || 'elevate-for-humanity/Elevate-lms';
const API = 'https://api.github.com';
const PR_NUMBER = Number(process.env.PR_NUMBER);
const EXPECTED_HEAD_SHA = process.env.EXPECTED_HEAD_SHA || '';
const REPAIR_ID = process.env.REPAIR_ID || '';
const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.elevateforhumanity.org';
const RUN_ID = Number(process.env.GITHUB_RUN_ID);

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw Error(`${name}_REQUIRED`);
  return value;
}

function gh(path, { token, method = 'GET', body } = {}) {
  return fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function ghJson(path, options) {
  const response = await gh(path, options);
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 200);
    throw Object.assign(Error(`PARIS_MERGE_GITHUB_HTTP_${response.status}: ${detail}`), { status: response.status });
  }
  return response.status === 204 ? {} : response.json();
}

async function optionalPolicy(path, token) {
  try {
    return await ghJson(path, { token });
  } catch (error) {
    // Only a verifiable classic-policy absence may be treated as null. A 403
    // (insufficient scope) or transport error is UNKNOWN and must block.
    if (error?.status === 404) {
      try {
        const body = await gh(path, { token });
        const parsed = await body.json().catch(() => null);
        if (parsed?.message === 'Branch not protected') return null;
      } catch { /* fall through to throw */ }
    }
    throw error;
  }
}

async function report(phase, payload) {
  const token = requireEnv('PARIS_ID_TOKEN');
  const response = await fetch(`${ADMIN_URL}/api/cron/paris-code-repair`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Paris-GitHub-Token': process.env.GH_TOKEN || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phase, repairId: REPAIR_ID, ...payload }),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text().catch(() => '');
  if (!response.ok) throw Error(`PARIS_MERGE_REPORT_REJECTED_${response.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

/** The Admin authority must confirm this PR and head are the ones the durable
 * repair record validated. Workflow inputs alone are never sufficient. */
async function authorizeMerge() {
  const result = await report('merge-authorize', { runId: RUN_ID, prNumber: PR_NUMBER, expectedHeadSha: EXPECTED_HEAD_SHA });
  if (result?.authorized !== true) {
    throw Error('PARIS_MERGE_NOT_AUTHORIZED: ' + (Array.isArray(result?.reasons) ? result.reasons.join('; ') : 'denied'));
  }
  return result;
}

async function verifyCurrentMainAncestor(token) {
  const main = await ghJson(`/repos/${REPOSITORY}/git/ref/heads/main`, { token });
  const mainSha = main.object?.sha;
  if (!/^[a-f0-9]{40}$/.test(mainSha ?? '')) throw Error('PARIS_MERGE_MAIN_SHA_UNVERIFIED');
  const ancestry = await ghJson(`/repos/${REPOSITORY}/compare/${mainSha}...${EXPECTED_HEAD_SHA}`, { token });
  if (!['ahead', 'identical'].includes(ancestry.status)) throw Error('PARIS_MERGE_BRANCH_NOT_UP_TO_DATE');
}

async function verifyExactHeadE2E(token) {
  const inventory = await ghJson(`/repos/${REPOSITORY}/actions/workflows/e2e-desktop-chrome.yml/runs?head_sha=${EXPECTED_HEAD_SHA}&event=pull_request&per_page=100`, { token });
  if (!Array.isArray(inventory.workflow_runs) || inventory.workflow_runs.length >= 100) throw Error('PARIS_MERGE_E2E_EVIDENCE_INCOMPLETE');
  const runs = inventory.workflow_runs.filter(run => run.head_sha === EXPECTED_HEAD_SHA &&
    run.event === 'pull_request' && run.path === '.github/workflows/e2e-desktop-chrome.yml' &&
    run.head_repository?.full_name === REPOSITORY).sort((a, b) => b.id - a.id || (b.run_attempt || 1) - (a.run_attempt || 1));
  const latest = runs[0];
  if (!latest || latest.status !== 'completed' || latest.conclusion !== 'success') throw Error('PARIS_MERGE_EXACT_HEAD_E2E_REQUIRED');
  const jobs = await ghJson(`/repos/${REPOSITORY}/actions/runs/${latest.id}/jobs?per_page=100`, { token });
  if (!Array.isArray(jobs.jobs) || jobs.jobs.length >= 100) throw Error('PARIS_MERGE_E2E_JOBS_INCOMPLETE');
  for (const name of ['E2E desktop-chrome', 'Public Host Shop navigation and application (five devices)', 'Email device browsers']) {
    const matches = jobs.jobs.filter(job => job.name === name);
    if (!matches.length || matches.some(job => job.status !== 'completed' || job.conclusion !== 'success')) throw Error('PARIS_MERGE_E2E_JOB_REQUIRED: ' + name);
  }
}

async function main() {
  if (!Number.isInteger(PR_NUMBER) || PR_NUMBER < 1) throw Error('PARIS_MERGE_PR_NUMBER_REQUIRED');
  if (!/^[a-f0-9]{40}$/.test(EXPECTED_HEAD_SHA)) throw Error('PARIS_MERGE_EXPECTED_HEAD_REQUIRED');
  // A stale optional verifier PAT must not prevent a zero-review workflow from
  // using its own authorized job token. Policy read authority stays separate.
  const mergeToken = process.env.GH_TOKEN?.trim() || requireEnv('PARIS_VERIFIER_TOKEN');
  const policy = process.env.PARIS_POLICY_TOKEN?.trim() || process.env.PARIS_VERIFIER_TOKEN?.trim() || mergeToken;
  const checkOnlySetting = process.env.PARIS_MERGE_CHECK_ONLY?.trim() || 'false';
  if (!['true', 'false'].includes(checkOnlySetting)) throw Error('PARIS_MERGE_CHECK_ONLY_INVALID');
  const checkOnly = checkOnlySetting === 'true';

  // Fail closed before any GitHub read or write: the repair record is the only
  // authority for which PR may be merged.
  await authorizeMerge();

  const pr = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}`, { token: mergeToken });
  // Independently re-confirm the PR GitHub actually returned is the recorded one.
  if (pr.number !== PR_NUMBER || pr.head?.sha !== EXPECTED_HEAD_SHA) {
    await report('merge-result', { merged: false, runId: process.env.GITHUB_RUN_ID ? Number(process.env.GITHUB_RUN_ID) : undefined, reason: 'PARIS_MERGE_PR_MISMATCH' });
    throw Error('PARIS_MERGE_PR_MISMATCH');
  }
  const checks = (await ghJson(`/repos/${REPOSITORY}/commits/${EXPECTED_HEAD_SHA}/check-runs?per_page=100`, { token: mergeToken })).check_runs ?? [];
  const reviews = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}/reviews?per_page=100`, { token: mergeToken });

  // Policy readback. Classic protection is authoritative when present.
  const [rules, classic] = await Promise.all([
    optionalPolicy(`/repos/${REPOSITORY}/rules/branches/main`, policy),
    optionalPolicy(`/repos/${REPOSITORY}/branches/main/protection`, policy),
  ]);
  const protectionVerified = protectedMainPolicyVerified({ rules, classic });
  const requiredChecks = requiredMainChecks({ rules, classic });
  const requiredApprovalCount = requiredMainReviewCount({ rules, classic });

  if (!protectionVerified) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_PROTECTION_UNVERIFIED' });
    throw Error('PARIS_MERGE_PROTECTION_UNVERIFIED');
  }

  // Reviewer authority is read with the policy credential, never inferred.
  const reviewerPermissions = {};
  const readReviewerPermissions = async reviewList => {
    if (!Array.isArray(reviewList) || reviewList.length >= 100) throw Error('PARIS_MERGE_REVIEW_EVIDENCE_INCOMPLETE');
    const decisionLogins = new Set(reviewList
      .filter(r => ['APPROVED', 'CHANGES_REQUESTED'].includes(r.state))
      .map(r => r.user?.login?.toLowerCase()).filter(Boolean));
    for (const login of decisionLogins) {
      if (Object.hasOwn(reviewerPermissions, login)) continue;
      if (!/^[a-z0-9](?:[a-z0-9-]{0,38})$/.test(login)) continue;
      try {
        const collaborator = await ghJson(`/repos/${REPOSITORY}/collaborators/${encodeURIComponent(login)}/permission`, { token: policy });
        reviewerPermissions[login] = collaborator.permission ?? 'unknown';
      } catch {
        reviewerPermissions[login] = 'unknown';
      }
    }
  };
  await readReviewerPermissions(reviews);

  const readiness = protectedMergeReadiness({
    pr, expectedHeadSha: EXPECTED_HEAD_SHA, checks, requiredChecks, reviews, reviewerPermissions, requiredApprovalCount,
  });
  if (!readiness.ready) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_NOT_READY', reasons: readiness.reasons.slice(0, 8) });
    throw Error('PARIS_MERGE_NOT_READY: ' + readiness.reasons.join('; '));
  }
  await verifyCurrentMainAncestor(mergeToken);
  await verifyExactHeadE2E(mergeToken);

  if (checkOnly) {
    const approvals = approvalsSatisfied({
      pr, expectedHeadSha: EXPECTED_HEAD_SHA, reviews, reviewerPermissions, requiredApprovalCount,
    });
    if (!approvals.satisfied) throw Error('PARIS_MERGE_APPROVALS_INSUFFICIENT: ' + approvals.reasons.join('; '));
    process.stdout.write(JSON.stringify({ checkOnly: true, ready: true, headSha: EXPECTED_HEAD_SHA, requiredApprovalCount }) + '\n');
    return;
  }

  // A verified zero-review policy never causes an APPROVE submission. Existing
  // positive policy still requires an independent human verifier and its real
  // GitHub collaborator authority; no workflow bot or author self-approval.
  if (requiredApprovalCount > 0 && !approvalsSatisfied({
    pr, expectedHeadSha: EXPECTED_HEAD_SHA, reviews, reviewerPermissions, requiredApprovalCount,
  }).satisfied) {
    const verifier = requireEnv('PARIS_VERIFIER_TOKEN');
    const identity = await ghJson('/user', { token: verifier });
    const verifierLogin = identity.login?.toLowerCase();
    const alreadyApproved = reviews.some(r =>
      r.user?.login?.toLowerCase() === verifierLogin && r.state === 'APPROVED' && r.commit_id === EXPECTED_HEAD_SHA);
    if (!alreadyApproved && identity.type === 'User' && verifierLogin && verifierLogin !== pr.user?.login?.toLowerCase()) {
      const collaborator = await ghJson(`/repos/${REPOSITORY}/collaborators/${encodeURIComponent(verifierLogin)}/permission`, { token: policy });
      if (!['write', 'maintain', 'admin'].includes(collaborator.permission)) throw Error('PARIS_MERGE_VERIFIER_NOT_AUTHORIZED');
      const review = await gh(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}/reviews`, {
        token: verifier, method: 'POST',
        body: { commit_id: EXPECTED_HEAD_SHA, event: 'APPROVE', body: 'Independent PARIS verification: validated candidate, required checks green, no outstanding change requests.' },
      });
      if (!review.ok && review.status !== 422) {
        const detail = (await review.text().catch(() => '')).slice(0, 200);
        await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_APPROVAL_FAILED', detail });
        throw Error(`PARIS_MERGE_APPROVAL_FAILED_${review.status}: ${detail}`);
      }
    }
  }

  // Prove the configured number of independent approvals on the exact head,
  // including the verifier's own review, before attempting the merge.
  const finalReviews = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}/reviews?per_page=100`, { token: mergeToken });
  await readReviewerPermissions(finalReviews);
  const approvals = approvalsSatisfied({
    pr, expectedHeadSha: EXPECTED_HEAD_SHA, reviews: finalReviews, reviewerPermissions, requiredApprovalCount,
  });
  if (!approvals.satisfied) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_APPROVALS_INSUFFICIENT', reasons: approvals.reasons.slice(0, 8) });
    throw Error('PARIS_MERGE_APPROVALS_INSUFFICIENT: ' + approvals.reasons.join('; '));
  }

  // Required checks must be green on the exact head at merge time.
  const finalChecks = (await ghJson(`/repos/${REPOSITORY}/commits/${EXPECTED_HEAD_SHA}/check-runs?per_page=100`, { token: mergeToken })).check_runs ?? [];
  const stillGreen = requiredChecksSatisfied({ checks: finalChecks, requiredChecks });
  if (!stillGreen.satisfied) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_CHECKS_REGRESSED', reasons: stillGreen.reasons.slice(0, 8) });
    throw Error('PARIS_MERGE_CHECKS_REGRESSED');
  }

  // A fresh head read closes the approve→merge race.
  const current = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}`, { token: mergeToken });
  if (current.head?.sha !== EXPECTED_HEAD_SHA) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_HEAD_MOVED' });
    throw Error('PARIS_MERGE_HEAD_MOVED');
  }
  const finalReadiness = protectedMergeReadiness({
    pr: current, expectedHeadSha: EXPECTED_HEAD_SHA, checks: finalChecks, requiredChecks,
    reviews: finalReviews, reviewerPermissions, requiredApprovalCount,
  });
  if (!finalReadiness.ready) throw Error('PARIS_MERGE_NOT_READY: ' + finalReadiness.reasons.join('; '));
  const [currentRules, currentClassic] = await Promise.all([
    optionalPolicy(`/repos/${REPOSITORY}/rules/branches/main`, policy),
    optionalPolicy(`/repos/${REPOSITORY}/branches/main/protection`, policy),
  ]);
  if (!protectedMainPolicyVerified({ rules: currentRules, classic: currentClassic }) ||
      requiredMainReviewCount({ rules: currentRules, classic: currentClassic }) !== requiredApprovalCount ||
      JSON.stringify(requiredMainChecks({ rules: currentRules, classic: currentClassic })) !== JSON.stringify(requiredChecks)) {
    throw Error('PARIS_MERGE_POLICY_CHANGED');
  }
  await verifyCurrentMainAncestor(mergeToken);
  await verifyExactHeadE2E(mergeToken);

  const merged = await gh(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}/merge`, {
    token: mergeToken, method: 'PUT',
    body: { sha: EXPECTED_HEAD_SHA, merge_method: 'squash', commit_title: `PARIS verified repair ${REPAIR_ID.slice(0, 8)}` },
  });
  if (!merged.ok) {
    const detail = (await merged.text().catch(() => '')).slice(0, 300);
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_FAILED', detail });
    throw Error(`PARIS_MERGE_FAILED_${merged.status}: ${detail}`);
  }
  const result = await merged.json();
  await report('merge-result', { merged: true, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, mergeCommitSha: result.sha, prNumber: PR_NUMBER });
  // GITHUB_TOKEN merges do not emit push-triggered runs. Explicitly request
  // the real full CI at this exact new main before the existing release chain
  // dispatches Google deployments. A moved main must never validate this SHA.
  const mergedMain = await ghJson(`/repos/${REPOSITORY}/git/ref/heads/main`, { token: mergeToken });
  if (!/^[a-f0-9]{40}$/.test(result.sha ?? '') || mergedMain.object?.sha !== result.sha) {
    throw Error('PARIS_MERGE_POST_MERGE_MAIN_CHANGED');
  }
  await report('merge-result', { merged: true, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, mergeCommitSha: result.sha, reason: 'PARIS_MERGE_MAIN_CI_REQUESTED' });
  try {
    await ghJson(`/repos/${REPOSITORY}/actions/workflows/ci.yml/dispatches`, {
      token: process.env.GH_TOKEN?.trim() || mergeToken, method: 'POST',
      body: { ref: 'main', inputs: { requested_sha: result.sha } },
    });
  } catch (error) {
    await report('merge-result', { merged: true, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, mergeCommitSha: result.sha, reason: 'PARIS_MERGE_MAIN_CI_DISPATCH_FAILED' });
    throw error;
  }
  process.stdout.write(JSON.stringify({ merged: true, mergeCommitSha: result.sha }) + '\n');
}

main().catch(async error => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write('PARIS_PROTECTED_MERGE_FAILED ' + message + '\n');
  process.exitCode = 1;
});
