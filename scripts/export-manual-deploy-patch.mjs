#!/usr/bin/env node
/**
 * Export committed Codex changes as a patch package for manual GitHub deploy.
 *
 * This is for cloud containers that can edit/commit but cannot reach GitHub or
 * Northflank because outbound HTTPS/DNS is blocked. It does not deploy. It
 * creates a patch and an instruction file that an operator can apply locally,
 * push to GitHub, and let GitHub Actions/Northflank deploy.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

function sh(command, options = {}) {
  return execFileSync(command[0], command.slice(1), {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function trySh(command) {
  try {
    return sh(command);
  } catch {
    return '';
  }
}

function resolveBase() {
  const explicit = args.get('base') || process.env.PATCH_BASE_REF;
  if (explicit) return explicit;

  for (const ref of ['origin/work', 'origin/main', 'main']) {
    const base = trySh(['git', 'merge-base', 'HEAD', ref]);
    if (base) return base;
  }

  return 'HEAD~1';
}

const base = resolveBase();
const targetBranch = args.get('target-branch') || process.env.PATCH_TARGET_BRANCH || sh(['git', 'branch', '--show-current']) || 'work';
const outputDir = path.resolve(root, args.get('out-dir') || process.env.PATCH_OUTPUT_DIR || '/tmp/elevate-codex-deploy');
const patchPath = path.join(outputDir, 'codex-fixes.patch');
const instructionsPath = path.join(outputDir, 'APPLY_AND_DEPLOY.md');
const commitMessage = args.get('commit-message') || process.env.PATCH_COMMIT_MESSAGE || 'Reconcile documentation with implementation and fix system failures';

fs.mkdirSync(outputDir, { recursive: true });

const patch = sh(['git', 'diff', '--binary', `${base}..HEAD`]);
if (!patch) {
  throw new Error(`No committed diff found between ${base} and HEAD.`);
}
fs.writeFileSync(patchPath, `${patch}\n`, 'utf8');

const head = sh(['git', 'rev-parse', '--short', 'HEAD']);
const fullHead = sh(['git', 'rev-parse', 'HEAD']);
const status = sh(['git', 'status', '--branch', '--short']);
const changedFiles = sh(['git', 'diff', '--name-only', `${base}..HEAD`]).split('\n').filter(Boolean);
const log = sh(['git', 'log', '--oneline', `${base}..HEAD`]);

const instructions = `# Manual GitHub deployment package

This package exists because the Codex/container environment can commit code but cannot deploy directly when outbound HTTPS/DNS to GitHub or Northflank is blocked.

## Package metadata

| Field | Value |
| --- | --- |
| Target branch | \`${targetBranch}\` |
| Patch base | \`${base}\` |
| HEAD commit | \`${fullHead}\` |
| Short HEAD | \`${head}\` |
| Patch file | \`${patchPath}\` |
| Suggested commit message | \`${commitMessage}\` |

## Commits included

\`\`\`text
${log}
\`\`\`

## Files included in the patch

${changedFiles.map((file) => `- \`${file}\``).join('\n')}

## Apply locally

Run these commands on a machine or GitHub Codespace/Gitpod that can reach GitHub:

\`\`\`bash
git clone https://github.com/elevateforhumanity/Elevate-lms.git
cd Elevate-lms
git checkout ${targetBranch}
git pull origin ${targetBranch}
git apply --check /path/to/codex-fixes.patch
git apply /path/to/codex-fixes.patch
git status
git add .
git commit -m "${commitMessage}"
git push origin ${targetBranch}
\`\`\`

If this branch already contains some of these commits, apply with a fresh branch from the correct base or cherry-pick the missing commits instead.

## Environment variables required for deployment

Set these in GitHub repository secrets and/or Northflank secret groups before triggering production deploys:

- \`NORTHFLANK_API_TOKEN\`
- \`NORTHFLANK_TEAM_ID\` (default used by workflows: \`elevates-team\`)
- \`NORTHFLANK_PROJECT_ID\` (default used by workflows: \`elevate-platform\`)
- \`NORTHFLANK_LMS_SERVICE_ID\` (default used by workflows: \`elevate-lms\`)
- \`NORTHFLANK_ADMIN_SERVICE_ID\` (default used by workflows: \`elevate-admin\`)
- \`GITHUB_TOKEN\` or a GitHub token with workflow permission if dispatching workflows outside the GitHub UI

Application-specific production secrets still need to be present for live validation: Supabase URL/anon/service-role keys, Stripe keys/webhook secrets, AI provider keys, email provider keys, storage credentials, and any workforce/credential provider secrets required by the feature being deployed.

## Trigger deployment after push

Preferred production deploy options after the patch is pushed:

1. GitHub UI: Actions → **Deploy production (both services)** → Run workflow → branch \`${targetBranch}\`.
2. GitHub CLI from an unrestricted machine:

\`\`\`bash
gh workflow run deploy-production-dispatch.yml --ref ${targetBranch}
\`\`\`

3. GitHub REST API from an unrestricted machine:

\`\`\`bash
curl -X POST \\
  -H 'Accept: application/vnd.github+json' \\
  -H "Authorization: Bearer $GITHUB_TOKEN" \\
  https://api.github.com/repos/elevateforhumanity/Elevate-lms/actions/workflows/deploy-production-dispatch.yml/dispatches \\
  -d '{"ref":"${targetBranch}"}'
\`\`\`

Use \`deploy-admin.yml\` for admin-only or \`deploy-lms.yml\` for LMS-only deploys.

## Current container status at export time

\`\`\`text
${status}
\`\`\`

Do not attempt Northflank deployment from the blocked Codex container. Move this patch to GitHub and deploy from GitHub Actions or an operator machine with working egress.
`;

fs.writeFileSync(instructionsPath, instructions, 'utf8');

console.log(JSON.stringify({
  outputDir,
  patchPath,
  instructionsPath,
  base,
  targetBranch,
  head: fullHead,
  changedFiles: changedFiles.length,
}, null, 2));
