/**
 * Retired bulk-credential export.
 *
 * Elevate does not export, display, or email plaintext passwords. Each user
 * must set their own password through a single-use Supabase Auth link.
 */

console.error(
  'This script is retired. Bulk plaintext credential exports are prohibited.',
);
process.exitCode = 1;
