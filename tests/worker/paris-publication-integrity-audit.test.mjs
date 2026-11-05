import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../../scripts/operations/paris-publication-integrity.sql',import.meta.url),'utf8');

test('publication audit is strictly read-only and preserves learner versions',()=>{
 assert.match(sql,/FROM public\.ultimate_release_versions/);
 assert.match(sql,/FROM public\.course_versions/);
 assert.match(sql,/FROM public\.course_lesson_release_weeks/);
 assert.match(sql,/independently_approved_lessons/);
 assert.match(sql,/publication_acceptance_evidence_missing/);
 assert.match(sql,/draft_course_has_incrementally_published_lessons/);
 assert.doesNotMatch(sql,/\b(?:UPDATE|INSERT|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE)\s+(?:TABLE|FROM|INTO|public\.)/i);
});
