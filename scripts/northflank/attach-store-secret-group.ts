#!/usr/bin/env tsx
/** Attach the existing production Northflank secret group to elevate-store.
 *
 * This changes only secret-group restrictions. It never reads, logs or rewrites
 * secret values, so a deployment does not depend on duplicating production
 * credentials into GitHub Actions.
 */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const SERVICE_ID = process.env.NORTHFLANK_STORE_SERVICE_ID || 'elevate-store';
const SECRET_ID = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';

type SecretMetadata = {
  restrictions?: {
    restricted?: boolean;
    nfObjects?: Array<{ id: string; type: 'service' | 'job' }>;
    tags?: string[];
    tagMatchCondition?: 'and' | 'or';
  };
};

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  const current = await nfFetch<SecretMetadata>(projectApiPath(projectId, `/secrets/${SECRET_ID}`));
  const restrictions = current.restrictions ?? {};
  const nfObjects = restrictions.nfObjects ?? [];
  const alreadyAttached = nfObjects.some((item) => item.type === 'service' && item.id === SERVICE_ID);
  if (alreadyAttached) {
    console.log(`${SECRET_ID} already grants ${SERVICE_ID} access.`);
    return;
  }

  const nextObjects = [...nfObjects, { id: SERVICE_ID, type: 'service' as const }];
  await nfFetch(projectApiPath(projectId, `/secrets/${SECRET_ID}`), {
    method: 'PATCH',
    body: JSON.stringify({
      restrictions: {
        restricted: true,
        nfObjects: nextObjects,
        tags: restrictions.tags ?? [],
        tagMatchCondition: restrictions.tagMatchCondition ?? 'or',
      },
    }),
  });

  const verified = await nfFetch<SecretMetadata>(projectApiPath(projectId, `/secrets/${SECRET_ID}`));
  const granted = verified.restrictions?.nfObjects?.some(
    (item) => item.type === 'service' && item.id === SERVICE_ID,
  );
  if (!granted) throw new Error(`Northflank did not persist ${SERVICE_ID} on ${SECRET_ID}`);
  console.log(`Attached ${SECRET_ID} to ${SERVICE_ID} without changing secret values.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
