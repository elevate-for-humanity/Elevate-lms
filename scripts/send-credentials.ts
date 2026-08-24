/**
 * Retired credential-email script.
 *
 * Passwords must never be stored in source, shared in bulk, or sent by email.
 * Provision users through Supabase Auth and send the normal one-time password
 * setup/reset link from the authenticated Admin workflow instead.
 */

console.error(
  'This script is retired. Use the Admin password setup/reset invitation workflow.',
);
process.exitCode = 1;
