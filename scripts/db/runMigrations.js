// scripts/db/runMigrations.js
//
// RETIRED.
//
// This repository previously replayed every SQL migration through a custom
// service-role RPC (`public.exec_sql`) and tracked filenames in
// `public.efh_migrations`. That created a second migration history beside
// Supabase's canonical `supabase_migrations.schema_migrations` ledger and caused
// legacy migrations to be retried against the current production schema.
//
// Do not re-enable this executor. It cannot safely run migrations containing
// transaction control and must not be used to mutate Supabase-managed schemas.
// Use the `Supabase Migrations` GitHub workflow / Supabase CLI so migration
// history is compared against the official remote ledger before any apply.

console.error(
  '[runMigrations] RETIRED: use the Supabase Migrations workflow / Supabase CLI. ' +
    'The legacy exec_sql replay path is intentionally disabled.',
);
process.exit(1);
