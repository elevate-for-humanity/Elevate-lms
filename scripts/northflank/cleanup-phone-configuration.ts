#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type Json = Record<string, any>;
const secretGroupId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';

function findSecret(root: unknown, key: string): string | undefined {
  if (!root || typeof root !== 'object') return undefined;
  if (Array.isArray(root)) {
    for (const item of root) {
      const value = findSecret(item, key);
      if (value) return value;
    }
    return undefined;
  }
  const record = root as Json;
  if (typeof record[key] === 'string') return record[key];
  if (
    String(record.key ?? record.name ?? '') === key &&
    typeof (record.value ?? record.secret) === 'string'
  ) {
    return String(record.value ?? record.secret);
  }
  for (const value of Object.values(record)) {
    const found = findSecret(value, key);
    if (found) return found;
  }
  return undefined;
}

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');
  const group = await nfFetch<Json>(projectApiPath(projectId, `/secrets/${secretGroupId}`));
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    findSecret(group, 'NEXT_PUBLIC_SUPABASE_URL') ||
    findSecret(group, 'SUPABASE_URL');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    findSecret(group, 'SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Production Supabase credentials are unavailable');

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const accidentalNumber = '+13173143757';
  const { data: candidates, error: readError } = await db
    .from('phone_numbers')
    .select('id,e164,label,source,is_primary')
    .eq('e164', accidentalNumber);
  if (readError) throw new Error(readError.message);

  const removable = (candidates ?? []).filter(
    (row) => row.source === 'external_forwarding' && row.is_primary !== true,
  );
  if (removable.length) {
    const { error: deleteError } = await db
      .from('phone_numbers')
      .delete()
      .in(
        'id',
        removable.map((row) => row.id),
      );
    if (deleteError) throw new Error(deleteError.message);
  }

  const [systems, numbers, destinations, routes, extensions] = await Promise.all([
    db.from('phone_systems').select('id,tenant_id,routing_mode,default_destination_id'),
    db.from('phone_numbers').select('id,phone_system_id,e164,source,status,is_primary'),
    db.from('phone_destinations').select('id,phone_system_id,enabled'),
    db.from('phone_menu_options').select('id,phone_system_id,destination_id,enabled'),
    db.from('communication_extensions').select('id,workspace_id,enabled'),
  ]);
  for (const result of [systems, numbers, destinations, routes, extensions]) {
    if (result.error) throw new Error(result.error.message);
  }
  console.log(
    'PHONE CONFIGURATION CLEANUP ' +
      JSON.stringify({
        accidental_external_number_removed: removable.length,
        phone_systems: systems.data?.length ?? 0,
        numbers: numbers.data?.length ?? 0,
        destinations: destinations.data?.length ?? 0,
        routes: routes.data?.length ?? 0,
        extensions: extensions.data?.length ?? 0,
      }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
