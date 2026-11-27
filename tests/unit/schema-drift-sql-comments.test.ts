// @vitest-environment node
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { stripSqlComments } from '../../scripts/lib/sql-comments.mjs';
it('keeps literal comment markers, quoted identifiers and function bodies intact', () => {
  const sql = `SELECT '--literal', "--identifier", $$--function body$$, $tag$/*body*/$tag$;
-- comment with commas, semicolons;
/* another comment */ SELECT 1;`;
  const cleaned = stripSqlComments(sql);
  expect(cleaned).toContain(
    `SELECT '--literal', "--identifier", $$--function body$$, $tag$/*body*/$tag$;`,
  );
  expect(cleaned).not.toContain('comment with commas');
  expect(cleaned.split('\n')).toHaveLength(sql.split('\n').length);
});
it('exposes every queried license column despite comments before scope and reference', () => {
  const sql = stripSqlComments(
    readFileSync('supabase/migrations/20261125080000_instructor_curriculum_ip_license.sql', 'utf8'),
  );
  const body = sql.match(
    /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.instructor_curriculum_licenses\s*\(([^;]+?)\);/is,
  )![1];
  for (const column of ['scope', 'license_reference', 'signature_receipt', 'revoked_at'])
    expect(body).toMatch(new RegExp(`(?:^|,)\\s*${column}\\s+`, 'm'));
});
