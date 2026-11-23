/**
 * lib/devstudio/capability-registry.ts
 *
 * One registry for what each Dev Studio capability runs on — so a panel
 * never looks working when its engine is dead.
 *
 * Statuses are facts as of 2026-11-23 (main e6e19ec9), from repo evidence:
 * - 'working': code exists and the path is exercised (or CI-verified).
 * - 'implemented-unverified': code exists, no live proof yet.
 * - 'unproven': code exists, the live record contradicts it.
 * - 'pending': waiting on an open PR to merge.
 *
 * Do not upgrade a status without evidence (a live run, a green CI run,
 * or a merged PR). When an engine is unproven, `fallback` names the path
 * that can do the job instead.
 */

export type CapabilityStatus = 'working' | 'implemented-unverified' | 'unproven' | 'pending';

export type DevStudioCapability = {
  id: string;
  capability: string;
  engine: string;
  status: CapabilityStatus;
  evidence: string;
  fallback?: string;
};

export const DEV_STUDIO_CAPABILITIES: DevStudioCapability[] = [
  {
    id: 'course-generation',
    capability: 'Course Builder — build a course',
    engine: 'Ultimate Course Builder, single builder (PR #2823)',
    status: 'pending',
    evidence: 'lib/course-builder/orchestrator.ts delegates to requestCanonicalGeneration; PR #2823 adds the job feed and gate; CI not green yet.',
  },
  {
    id: 'course-job-feed',
    capability: 'Course Builder — government job feed on a course',
    engine: 'lib/course-builder/workforce-evidence.ts (O*NET, CareerOneStop, USAJobs, BLS)',
    status: 'pending',
    evidence: 'PR #2823; feed clients exist in lib/industry/ and lib/onet/, but keys cannot be confirmed from the repo.',
  },
  {
    id: 'code-fix-muse-loop',
    capability: 'Code fix — read repo, change, PR, check CI',
    engine: 'Muse loop (lib/devstudio/muse-loop.ts) via the PARIS GitHub App',
    status: 'implemented-unverified',
    evidence: 'This PR. Unit-tested against a mocked GitHub API; first live run must be a small reviewed change.',
    fallback: 'Ask Muse in chat — it runs the same loop externally.',
  },
  {
    id: 'code-fix-openhands',
    capability: 'Code fix / autofix via OpenHands',
    engine: 'OpenHands (lib/devstudio/openhands/), key OPENHANDS_API_KEY',
    status: 'unproven',
    evidence: '29 tasks, 22 failed, 0 completed; key untested since 2026-09-15; HEAD fails closed on missing PARIS start receipt / pending approval.',
    fallback: 'code-fix-muse-loop',
  },
  {
    id: 'repair-ledger',
    capability: 'PARIS repair ledger (paris_code_repairs)',
    engine: 'lib/ai/runtime/code-repair.ts + deletion guard migration (PR #2812)',
    status: 'pending',
    evidence: 'Table exists with 0 rows after the 2026-11-17 deletion of 254 rows; PR #2812 guard migration not yet tested in QA.',
  },
  {
    id: 'phone',
    capability: 'Phone system readiness',
    engine: 'Twilio + Asterisk (PR #2813)',
    status: 'implemented-unverified',
    evidence: 'Readiness probe built in PR #2813; no live call or real-call acceptance record yet.',
  },
  {
    id: 'github-auth',
    capability: 'GitHub writes from Dev Studio',
    engine: 'PARIS GitHub App (ID 5477907) via lib/devstudio/github-token.ts',
    status: 'working',
    evidence: 'docs/devstudio/paris-github-app-auth.md; resolver verifies installation for Elevate-lms and caches tokens in server memory only.',
  },
  {
    id: 'muse-external',
    capability: 'Muse (external agent)',
    engine: 'Meta Muse AI GitHub App, Elevate-lms only',
    status: 'working',
    evidence: 'Installed 2026-11-23 on elevate-for-humanity org; PRs #2809–#2823 opened through it.',
  },
  {
    id: 'enrollment-access',
    capability: 'Student login / enrollment / hours',
    engine: 'lib/learner/approved-paid-admission.mjs + hours backfill (PR #2822)',
    status: 'pending',
    evidence: 'PR #2822 fixes the cosmetology/barber access fields and adds POST /api/admin/hours/backfill; hours for Reese (22.5h) and Logan (18h) recorded only after merge + deploy.',
  },
];

export function getCapabilityRegistry(): DevStudioCapability[] {
  return DEV_STUDIO_CAPABILITIES;
}

export function getCapability(id: string): DevStudioCapability | undefined {
  return DEV_STUDIO_CAPABILITIES.find((capability) => capability.id === id);
}
