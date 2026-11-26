import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const schema = read('lib/programs/program-schema.ts');
const detail = read('components/programs/ProgramDetailPage.tsx');
const payNow = read('components/programs/PayNowButton.tsx');
const card = detail.split('{/* Track 2: Self-pay */}')[1].split('{/* Reassurance line */}')[0];

test('shared self-pay card does not promise immediate or nationwide enrollment', () => {
  assert.match(schema, /label: 'Self-Pay Tuition'/);
  assert.doesNotMatch(schema, /Self-Pay — All States/);
  assert.match(card, /'Review Enrollment' : 'Enrollment Pending'/);
  assert.doesNotMatch(card, /Start Immediately/);
});

test('apprenticeship card explains start conditions without skipping canonical enrollment', () => {
  assert.match(card, /isApprenticeship && enrollmentTracks\.selfPay\.available/);
  assert.match(card, /Admissions confirms your training location, approved Host Shop placement, and\s+start date before training begins/);
  assert.match(card, /label=\{isApprenticeship \? 'Start Enrollment Application' : undefined\}/);
  assert.ok(payNow.includes('/programs/${encodeURIComponent(slug)}/apply'));
  assert.match(card, /Apply Before Payment/);
  assert.match(card, /Join the Waitlist/);
});
