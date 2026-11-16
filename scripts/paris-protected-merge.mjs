/**
 * Independent protected-merge driver for a validated PARIS repair PR.
 *
 * Runs inside the signed `paris-protected-merge` workflow with the verifier
 * identity (a repository collaborator whose GitHub user type is User, never a
 * bot, so its review satisfies the protected-branch independent-approval rule).
 *
 * It NEVER weakens a gate: it approves and merges only when the exact validated
 * head still satisfies the repository's required status check and the PR has no
 * outstanding authorized change request. Every precondition failure is reported
 * to the Admin authority and the PR is left untouched.
 *
 * Inputs (env):
 *   PARIS_VERIFIER_TOKEN  - collaborator PAT used to review and merge
 *   PARIS_POLICY_TOKEN    - optional policy reader (falls back to the verifier)
 *   GH_TOKEN              - workflow token used only for API reads if needed
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

async function main() {
  if (!Number.isInteger(PR_NUMBER) || PR_NUMBER < 1) throw Error('PARIS_MERGE_PR_NUMBER_REQUIRED');
  if (!/^[a-f0-9]{40}$/.test(EXPECTED_HEAD_SHA)) throw Error('PARIS_MERGE_EXPECTED_HEAD_REQUIRED');
  const verifier = requireEnv('PARIS_VERIFIER_TOKEN');
  const policy = process.env.PARIS_POLICY_TOKEN?.trim() || verifier;

  // Fail closed before any GitHub read or write: the repair record is the only
  // authority for which PR may be merged.
  await authorizeMerge();

  const pr = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}`, { token: verifier });
  // Independently re-confirm the PR GitHub actually returned is the recorded one.
  if (pr.number !== PR_NUMBER || pr.head?.sha !== EXPECTED_HEAD_SHA) {
    await report('merge-result', { merged: false, runId: process.env.GITHUB_RUN_ID ? Number(process.env.GITHUB_RUN_ID) : undefined, reason: 'PARIS_MERGE_PR_MISMATCH' });
    throw Error('PARIS_MERGE_PR_MISMATCH');
  }
  const checks = (await ghJson(`/repos/${REPOSITORY}/commits/${EXPECTED_HEAD_SHA}/check-runs?per_page=100`, { token: verifier })).check_runs ?? [];
  const reviews = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}/reviews?per_page=100`, { token: verifier });

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
    const decisionLogins = new Set(reviewList
      .filter(r => ['APPROVED', 'CHANGES_REQUESTED'].includes(r.state))
      .map(r => r.user?.login?.toLowerCase()).filter(Boolean));
    for (const login of decisionLogins) {
      if (login in reviewerPermissions) continue;
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

  // Idempotency: only submit an approval when the verifier has not already
  // approved the exact head. GitHub rejects duplicate reviews from one user.
  const verifierLogin = (await ghJson('/user', { token: verifier })).login?.toLowerCase();
  const alreadyApproved = reviews.some(r =>
    r.user?.login?.toLowerCase() === verifierLogin && r.state === 'APPROVED' && r.commit_id === EXPECTED_HEAD_SHA);
  if (!alreadyApproved && verifierLogin && verifierLogin !== pr.user?.login?.toLowerCase()) {
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

  // Prove the configured number of independent approvals on the exact head,
  // including the verifier's own review, before attempting the merge.
  const finalReviews = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}/reviews?per_page=100`, { token: verifier });
  await readReviewerPermissions(Array.isArray(finalReviews) ? finalReviews : []);
  const approvals = approvalsSatisfied({
    pr, expectedHeadSha: EXPECTED_HEAD_SHA, reviews: finalReviews, reviewerPermissions, requiredApprovalCount,
  });
  if (!approvals.satisfied) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_APPROVALS_INSUFFICIENT', reasons: approvals.reasons.slice(0, 8) });
    throw Error('PARIS_MERGE_APPROVALS_INSUFFICIENT: ' + approvals.reasons.join('; '));
  }

  // Required checks must be green on the exact head at merge time.
  const stillGreen = requiredChecksSatisfied({ checks, requiredChecks });
  if (!stillGreen.satisfied) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_CHECKS_REGRESSED', reasons: stillGreen.reasons.slice(0, 8) });
    throw Error('PARIS_MERGE_CHECKS_REGRESSED');
  }

  // A fresh head read closes the approve→merge race.
  const current = await ghJson(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}`, { token: verifier });
  if (current.head?.sha !== EXPECTED_HEAD_SHA) {
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_HEAD_MOVED' });
    throw Error('PARIS_MERGE_HEAD_MOVED');
  }

  const merged = await gh(`/repos/${REPOSITORY}/pulls/${PR_NUMBER}/merge`, {
    token: verifier, method: 'PUT',
    body: { sha: EXPECTED_HEAD_SHA, merge_method: 'squash', commit_title: `PARIS verified repair ${REPAIR_ID.slice(0, 8)}` },
  });
  if (!merged.ok) {
    const detail = (await merged.text().catch(() => '')).slice(0, 300);
    await report('merge-result', { merged: false, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, reason: 'PARIS_MERGE_FAILED', detail });
    throw Error(`PARIS_MERGE_FAILED_${merged.status}: ${detail}`);
  }
  const result = await merged.json();
  await report('merge-result', { merged: true, runId: Number.isSafeInteger(RUN_ID) ? RUN_ID : undefined, mergeCommitSha: result.sha, prNumber: PR_NUMBER });
  process.stdout.write(JSON.stringify({ merged: true, mergeCommitSha: result.sha }) + '\n');
}

main().catch(async error => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write('PARIS_PROTECTED_MERGE_FAILED ' + message + '\n');
  process.exitCode = 1;
});
