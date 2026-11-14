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

it('records a provider configuration or authorization problem without scheduling an unknown code repair', () => {
  expect(classifyParisFailure('PAID_INFERENCE_AUTHORIZATION_REQUIRED:ai-chat').category).toBe('approval');
  expect(classifyParisFailure('Provider override "openai" is not allowed; the configured provider is "elevate"').category).toBe('approval');
  expect(classifyParisFailure('Configured AI provider "elevate" is unavailable; repair its canonical configuration').category).toBe('credentials');
  expect(classifyParisFailure('Selected AI provider "elevate" is not configured').category).toBe('credentials');
});
