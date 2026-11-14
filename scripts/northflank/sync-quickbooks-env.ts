#!/usr/bin/env tsx
/** Merge QuickBooks OAuth credentials into the existing production secret group. */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const CANONICAL_REDIRECT_URI =
  'https://www.elevateforhumanity.org/api/auth/quickbooks/callback';

type SecretGroup = {
  name?: string;
  description?: string;
  priority?: number;
  type?: string;
  secretType?: string;
  restrictions?: unknown;
  secrets?: { variables?: Record<string, string> };
  variables?: Record<string, string>;
};

async function main() {
  if (!process.argv.includes('--execute')) {
    throw new Error('Refusing to update production without --execute');
  }

  const projectId = resolveProjectId();
  const groupId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
  const clientId = process.env.QB_CLIENT_ID?.trim();
  const clientSecret = process.env.QB_CLIENT_SECRET?.trim();

  if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');
  if (!clientId || !clientSecret) {
    throw new Error(
      'QB_CLIENT_ID and QB_CLIENT_SECRET must both exist in GitHub Actions Secrets',
    );
  }

  const existing = await nfFetch<SecretGroup>(
    projectApiPath(projectId, `/secrets/${groupId}`),
  );
  const existingVariables = existing.secrets?.variables || existing.variables || {};
  const variables = {
    ...existingVariables,
    QB_CLIENT_ID: clientId,
    QB_CLIENT_SECRET: clientSecret,
    QB_REDIRECT_URI: CANONICAL_REDIRECT_URI,
  };

  await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: existing.name || groupId,
      description: existing.description || 'Elevate shared production secrets/config',
      priority: existing.priority ?? 10,
      type: existing.type || 'secret',
      secretType: existing.secretType || 'environment',
      ...(existing.restrictions ? { restrictions: existing.restrictions } : {}),
      secrets: { variables },
    }),
  });

  console.log(
    `QuickBooks OAuth configuration updated in ${groupId}; preserved ${Object.keys(existingVariables).length} existing variables.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
