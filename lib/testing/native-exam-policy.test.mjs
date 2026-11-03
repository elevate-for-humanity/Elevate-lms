import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell, requiredSections, reportingPeriod } from './native-exam-policy.ts';
test('Universal requires four independent sections; a single type requires Core', () => {
  assert.deepEqual(requiredSections('universal'), ['core', 'type_i', 'type_ii', 'type_iii']);
  assert.deepEqual(requiredSections('type_ii'), ['core', 'type_ii']);
  assert.throws(() => requiredSections('core'));
});
test('report windows include June 30 and exclude July 1 without overlapping halves', () => {
  assert.deepEqual(reportingPeriod(2026, 1), {
    start: '2026-01-01T00:00:00.000Z',
    end: '2026-07-01T00:00:00.000Z',
  });
  assert.deepEqual(reportingPeriod(2026, 2), {
    start: '2026-07-01T00:00:00.000Z',
    end: '2027-01-01T00:00:00.000Z',
  });
  assert.throws(() => reportingPeriod(2026, 3));
});
test('CSV retains commas, quotes and multiline names while blocking spreadsheet formulas', () => {
  assert.equal(csvCell('Smith, "Jane"'), '"Smith, ""Jane"""');
  assert.equal(csvCell('=HYPERLINK("evil")'), '"\'=HYPERLINK(""evil"")"');
  assert.equal(csvCell('Jane\nSmith'), '"Jane\nSmith"');
});
