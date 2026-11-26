/**
 * Typed blocked-path reasons for PARIS repairs — pure helpers for PR1 (#2070).
 *
 * blockedPath() used to return a bare boolean, so a denied secret file, a
 * protected control path and a malformed traversal all collapsed into the
 * same "Repository path is not allowed." receipt. The regexes below are the
 * exact predicates from the previous boolean implementation, split by class
 * so a receipt can say which class denied the path. The block itself is
 * unchanged: no path in any class is ever allowed.
 *
 * Dependency-free on purpose: unit-tested without any credential or network.
 */

export type BlockedPathReason =
  | 'ALLOWED'
  | 'DENIED_INVALID'
  | 'DENIED_SECRET'
  | 'DENIED_PROTECTED';

const PROTECTED_PATH =
  /^(?:apps\/admin\/app\/api\/(?:cron\/paris-code-repair|dev-studio|internal)(?:\/|$)|lib\/ai\/paid-inference[^/]*|\.github(?:\/|$)|scripts(?:\/|$)|lib\/(?:devstudio|ai\/runtime|auth|rbac|supabase|secrets)(?:\/|\.|$)|lib\/paris-workflow-identity\.ts$|AGENTS\.md$|Dockerfile(?:\.|$)|(?:package(?:-lock)?\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$)/;
const PROTECTED_FILENAME =
  /(?:^|\/)(?:tsconfig[^/]*\.json|vitest\.config\.[^/]+|eslint\.config\.[^/]+|\.npmrc|AGENTS\.md)$/;
const PROTECTED_TEST =
  /^(?:tests\/unit\/(?:course-builder-live-preview|course-builder-assessment-preview|paris-course-integration)\.test\.tsx?|tests\/worker\/approved-picture-timeline\.test\.mjs)$/;
const SECRET_PATH =
  /(?:^|\/)(?:\.env(?:\.[^/]*)?|[^/]*\.(?:pem|key|p12|pfx)|id_(?:rsa|ed25519)[^/]*)$/i;

export function blockedPathReason(path: string): BlockedPathReason {
  if (
    !path ||
    path.includes('..') ||
    path.startsWith('/') ||
    path === '.git' ||
    path.startsWith('.git/') ||
    /(?:^|\/)(?:node_modules|\.next)(?:\/|$)/.test(path)
  ) {
    return 'DENIED_INVALID';
  }
  if (SECRET_PATH.test(path)) return 'DENIED_SECRET';
  if (PROTECTED_PATH.test(path) || PROTECTED_FILENAME.test(path) || PROTECTED_TEST.test(path)) {
    return 'DENIED_PROTECTED';
  }
  return 'ALLOWED';
}

/** Broad application repairs remain allowed. Authorization, validation and
 * release controls require a separately reviewed change, never self-approval. */
export function blockedPath(path: string): boolean {
  return blockedPathReason(path) !== 'ALLOWED';
}
