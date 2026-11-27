import { expect, it } from 'vitest';
import { blockedPath, blockedPathReason } from '@/lib/devstudio/paris-blocked-path';
import {
  GITHUB_APP_403_BRANCH,
  classifyRepoBranchPermission,
  githubBranchAuthorityError,
  isGitHubBranchAuthorityError,
} from '@/lib/devstudio/github-branch-authority';
import { classifySearchFailure } from '@/lib/devstudio/github-search-fallback';

// PR1 (#2070): a 403 on POST /git/refs must be a distinct receipt, not a
// generic GitHub failure, and blocked paths must carry a typed reason.

it('classifies branch authority from the repository permissions object', () => {
  expect(classifyRepoBranchPermission({ push: true })).toBe('push');
  expect(classifyRepoBranchPermission({ push: false })).toBe('no-push');
  expect(classifyRepoBranchPermission({ pull: true, push: false })).toBe('no-push');
  // Installation tokens get all-false flags on a repo they can read and write.
  expect(
    classifyRepoBranchPermission({ admin: false, maintain: false, pull: false, push: false, triage: false }),
  ).toBe('not-reported');
  expect(classifyRepoBranchPermission({})).toBe('unknown');
  expect(classifyRepoBranchPermission(null)).toBe('unknown');
  expect(classifyRepoBranchPermission({ admin: true })).toBe('unknown');
});

it('builds a distinct, actionable GITHUB_APP_403_BRANCH error', () => {
  const error = githubBranchAuthorityError('GitHub returned HTTP 403.');
  expect(error.message).toContain(GITHUB_APP_403_BRANCH);
  expect(error.message).toContain('Contents: write');
  expect(error.message).toContain('GitHub returned HTTP 403.');
  expect(isGitHubBranchAuthorityError(error)).toBe(true);
  expect(isGitHubBranchAuthorityError(new Error('GitHub API 403'))).toBe(false);
  expect(isGitHubBranchAuthorityError(null)).toBe(false);
});

it('keeps application paths allowed and denies secrets, protected and invalid paths distinctly', () => {
  expect(blockedPathReason('apps/lms/app/page.tsx')).toBe('ALLOWED');
  expect(blockedPath('apps/lms/app/page.tsx')).toBe(false);
  expect(blockedPathReason('lib/devstudio/github-token.ts')).toBe('DENIED_PROTECTED');
  expect(blockedPathReason('.github/workflows/deploy.yml')).toBe('DENIED_PROTECTED');
  expect(blockedPathReason('package.json')).toBe('DENIED_PROTECTED');
  expect(blockedPathReason('scripts/gcp/deploy-owned-cpu-model.mjs')).toBe('DENIED_PROTECTED');
  expect(blockedPathReason('lib/ai/runtime/code-repair.ts')).toBe('DENIED_PROTECTED');
  expect(blockedPathReason('.env')).toBe('DENIED_SECRET');
  expect(blockedPathReason('apps/lms/.env.local')).toBe('DENIED_SECRET');
  expect(blockedPathReason('certs/service.key')).toBe('DENIED_SECRET');
  expect(blockedPathReason('../outside.ts')).toBe('DENIED_INVALID');
  expect(blockedPathReason('/absolute/path.ts')).toBe('DENIED_INVALID');
  expect(blockedPathReason('')).toBe('DENIED_INVALID');
  expect(blockedPathReason('node_modules/vitest/index.js')).toBe('DENIED_INVALID');
  expect(blockedPathReason('.git/config')).toBe('DENIED_INVALID');
  for (const path of [
    'lib/devstudio/github-token.ts',
    '.env',
    '../outside.ts',
  ]) {
    expect(blockedPath(path)).toBe(true);
  }
});

it('distinguishes search-unavailable from search-no-results', () => {
  expect(classifySearchFailure(429)).toBe('SEARCH_RATE_LIMITED_FALLBACK');
  expect(classifySearchFailure(403)).toBe('SEARCH_FORBIDDEN_FALLBACK');
  expect(classifySearchFailure(401, true)).toBe('SEARCH_FORBIDDEN_FALLBACK');
  expect(classifySearchFailure(401, false)).toBe('none');
  expect(classifySearchFailure(500)).toBe('none');
  expect(classifySearchFailure(200)).toBe('none');
});
