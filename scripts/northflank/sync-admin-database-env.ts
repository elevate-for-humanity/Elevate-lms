#!/usr/bin/env tsx
/**
 * Reconcile the Admin runtime's database/worker credentials without replacing
 * unrelated production secrets in the shared Northflank group.
 */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const EXPECTED_PROJECT_REF = 'cuxzzpsyufcewtmicszk';
const SECRET_GROUP_ID = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required production value: ${name}`);
  return value;
}

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

  const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL');
  if (new URL(supabaseUrl).hostname !== `${EXPECTED_PROJECT_REF}.supabase.co`) {
    throw new Error('Refusing Admin deployment: GitHub Supabase URL is not the canonical project');
  }

  const current = await nfFetch<any>(projectApiPath(projectId, `/secrets/${SECRET_GROUP_ID}`));
  const existingVariables = current?.secrets?.variables;
  if (!existingVariables || typeof existingVariables !== 'object') {
    throw new Error(`Northflank secret group ${SECRET_GROUP_ID} has no readable variables`);
  }

  const variables = {
    ...existingVariables,
    SUPABASE_PROJECT_REF: EXPECTED_PROJECT_REF,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
    CRON_SECRET: required('CRON_SECRET'),
  };

  await nfFetch(projectApiPath(projectId, `/secrets/${SECRET_GROUP_ID}`), {
    method: 'POST',
    body: JSON.stringify({
      name: current.name || SECRET_GROUP_ID,
      description: current.description || 'Elevate shared production secrets/config',
      priority: current.priority ?? 10,
      type: 'secret',
      secretType: 'environment',
      restrictions: current.restrictions,
      secrets: { variables },
    }),
  });

  console.log(
    `Reconciled Admin database binding in ${SECRET_GROUP_ID}; preserved ${Object.keys(existingVariables).length} existing variables.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
