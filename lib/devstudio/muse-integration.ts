/**
 * lib/devstudio/muse-integration.ts
 *
 * What Muse is in this setup, as data — no secrets, no live calls.
 *
 * Muse is Meta's AI agent, connected to this repository through the Meta
 * Muse AI GitHub App. It is an EXTERNAL agent: it does not run inside
 * Dev Studio, the Admin app, or any Elevate server. It works the way an
 * engineer with a GitHub App installation works: it reads the repo, makes
 * changes on a branch, opens a PR, and checks CI.
 *
 * Do not confuse it with the PARIS GitHub App ("PARIS Engineer for Elevate",
 * App ID 5477907, docs/devstudio/paris-github-app-auth.md). That App is
 * the in-repo runtime agent's credential: Dev Studio's own code (the
 * PARIS/OpenHands adapter, the git route, and now the Muse loop in
 * lib/devstudio/muse-loop.ts) uses it to call the GitHub API from the
 * Admin server. Muse's App is a separate installation, owned by Meta,
 * and nothing in this repo can call it — Dev Studio can only reproduce
 * the loop Muse performs, using the PARIS App credential.
 */

export const MUSE_INTEGRATION = {
  agent: 'Muse',
  provider: 'Meta',
  appName: 'Meta Muse AI',
  installed: '2026-11-23',
  organization: 'elevate-for-humanity',
  repository: 'elevate-for-humanity/Elevate-lms',
  repositorySelection: 'Only select repositories (exactly 1 repo)',
  permissions: [
    'read metadata',
    'read/write code',
    'read/write issues',
    'read/write pull requests',
  ],
  /** Muse never merges on its own in this setup; merges are a human decision. */
  merges: 'human-only',
  /** Muse is not a runtime inside this repo — there is no Muse code here. */
  runsInsideRepo: false,
} as const;

export const PARIS_GITHUB_APP = {
  appName: 'PARIS Engineer for Elevate',
  appId: 5477907,
  repository: 'elevate-for-humanity/Elevate-lms',
  credential: 'GitHub App installation token, server memory only (lib/devstudio/github-app-token.ts)',
  usedBy: [
    'lib/devstudio/paris-openhands-adapter.ts (OpenHands repair flow)',
    'apps/admin/app/api/admin/dev-studio/git/route.ts (branch/commit via API)',
    'lib/devstudio/muse-loop.ts (Muse-style loop, no OpenHands)',
  ],
} as const;

export type MuseIntegrationDescriptor = {
  muse: typeof MUSE_INTEGRATION;
  parisApp: typeof PARIS_GITHUB_APP;
  /** The loop Dev Studio can drive itself, without OpenHands. */
  studioLoop: {
    module: 'lib/devstudio/muse-loop.ts';
    route: '/api/admin/dev-studio/muse-loop';
    steps: ['read-base', 'create-branch', 'commit-files', 'open-pr', 'check-ci'];
    requires: 'admin/super_admin role + access_dev_tools permission';
    never: 'merges to main; production writes; OpenHands dispatch';
  };
  /** What Muse does that Dev Studio still cannot do itself. */
  gaps: string[];
};

export function getMuseIntegrationDescriptor(): MuseIntegrationDescriptor {
  return {
    muse: MUSE_INTEGRATION,
    parisApp: PARIS_GITHUB_APP,
    studioLoop: {
      module: 'lib/devstudio/muse-loop.ts',
      route: '/api/admin/dev-studio/muse-loop',
      steps: ['read-base', 'create-branch', 'commit-files', 'open-pr', 'check-ci'],
      requires: 'admin/super_admin role + access_dev_tools permission',
      never: 'merges to main; production writes; OpenHands dispatch',
    },
    gaps: [
      'Dev Studio has no live proof the Muse loop runs end-to-end from the Admin server yet — unit tests mock GitHub; the first live run must be a small, reviewed change.',
      'OpenHands remains the only engine for the repair/autofix panels, and it has 0 completed tasks — those panels should route to the Muse loop until OpenHands is proven live.',
      'Muse itself cannot be invoked from Dev Studio; an operator asks Muse in chat, or uses the Muse loop route for the same steps.',
    ],
  };
}
