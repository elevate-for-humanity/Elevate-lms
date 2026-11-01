import { describe, it, expect } from 'vitest';
import { classifyParisFailure } from '../../lib/ai/runtime/supervision';

describe('PARIS failure root-cause classification', () => {
 it('escalates GitHub authentication failures rather than retrying mutations', () => {
  expect(classifyParisFailure('GitHub code search failed: 401').category).toBe('credentials');
  expect(classifyParisFailure('Resource not accessible by personal access token').recovery).toBe('attention_required');
 });
 it('does not rerun missing instructional-source work as transient', () => {
  expect(classifyParisFailure('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED').category).toBe('source');
 });
 it('preserves bounded retries only for genuine transient faults', () => {
  expect(classifyParisFailure('The operation was aborted due to timeout').recovery).toBe('existing_retry_policy');
 });
});
