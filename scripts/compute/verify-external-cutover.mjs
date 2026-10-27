#!/usr/bin/env node
/**
 * Read-only external Course Builder cutover preflight.
 * Never prints credentials, performs network requests, dispatches jobs, or changes production.
 * Exit 0 means configuration shape is present, NOT that Modal/B2/playback acceptance passed.
 */
const e = process.env;
const checks = [
  ['Independent Course Builder database', /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(e.COURSE_BUILDER_SUPABASE_URL || '') &&
    new URL(e.COURSE_BUILDER_SUPABASE_URL).hostname === 'liwxpxhccbaxwylpnapo.supabase.co'],
  ['Platform Supabase database', /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(e.SUPABASE_URL || '') &&
    new URL(e.SUPABASE_URL).hostname === 'cuxzzpsyufcewtmicszk.supabase.co'],
  ['Independent database is not platform database', !!e.COURSE_BUILDER_SUPABASE_URL &&
    e.COURSE_BUILDER_SUPABASE_URL !== e.SUPABASE_URL],
  ['Immutable external worker image', /^[a-z0-9./_-]+@sha256:[a-f0-9]{64}$/.test(e.MODAL_COURSE_IMAGE || '')],
  ['Private Modal broker URL', /^https:\/\//.test(e.MODAL_COMPUTE_ENDPOINT || '')],
  ['Broker proxy key present', !!e.MODAL_PROXY_KEY],
  ['Broker proxy secret present', !!e.MODAL_PROXY_SECRET],
  ['External compute remains opt-in', e.EXTERNAL_COMPUTE_ENABLED === 'false' || !e.EXTERNAL_COMPUTE_ENABLED],
];
for (const [name, ok] of checks) console.log((ok ? 'PASS ' : 'BLOCK ') + name);
const failed = checks.filter(([, ok]) => !ok).length;
console.log(failed ? 'NOT_READY: ' + failed + ' preflight checks blocked' :
  'CONFIG_SHAPE_OK: live provider, billing, quota, auth, storage and lesson playback acceptance still required');
if (failed) process.exitCode = 1;
