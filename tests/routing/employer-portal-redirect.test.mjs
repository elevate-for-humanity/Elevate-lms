import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Source-route regression: public Marketing must not send employer portal
// entrants to informational /employers or perform its own LMS auth.
const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Employer portal entry resolves to canonical LMS host', () => {
 const entry=read('apps/marketing/app/employer/page.tsx');
 const registry=read('lib/routing/portal-map.ts');
 assert.match(entry,/PORTAL_MAP\.employer/);
 assert.match(entry,/employer\.host/);
 assert.match(entry,/employer\.defaultPath/);
 assert.doesNotMatch(entry,/redirect\(['"]\/employers['"]\)/);
 assert.match(registry,/defaultPath: '\/employer\/dashboard'/);
});

test('Marketing employer layout does not preempt canonical redirect with unrelated authentication', () => {
 const layout=read('apps/marketing/app/employer/layout.tsx');
 assert.doesNotMatch(layout,/requireRole\(/);
 assert.doesNotMatch(layout,/__efh_pathname/);
});

test('Legacy employer subpaths preserve route on LMS instead of looping through Marketing', () => {
 const entry=read('apps/marketing/app/employer/[...path]/page.tsx');
 assert.match(entry,/PORTAL_MAP\.employer\.host/);
 assert.match(entry,/encodeURIComponent\(segment\)/);
 assert.doesNotMatch(entry,/redirect\(['"]\/employer\/dashboard['"]\)/);
});
