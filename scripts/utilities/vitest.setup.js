import { expect } from 'vitest';
globalThis.expect = expect;
// Only import jest-dom if running in jsdom (for React tests)
if (typeof window !== 'undefined' && window.document) {
  await import('@testing-library/jest-dom');
}
