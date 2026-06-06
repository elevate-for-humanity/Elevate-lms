import { describe, expect, it } from 'vitest';
import {
  slugifyWorkspaceName,
  normalizeWorkspaceSlug,
  ensureUniqueSlugCandidate,
} from '@/lib/workspace/slug';
import { normalizeWorkspaceTier } from '@/lib/workspace/tier-limits';

describe('workspace slug helpers', () => {
  it('slugifies organization names', () => {
    expect(slugifyWorkspaceName('Acme Training Co.')).toBe('acme-training-co');
  });

  it('rejects reserved slugs', () => {
    expect(() => normalizeWorkspaceSlug('admin')).toThrow(/reserved/i);
  });

  it('appends suffix when slug is taken', () => {
    const next = ensureUniqueSlugCandidate('acme', true);
    expect(next).toMatch(/^acme-[a-z0-9]+$/);
  });
});

describe('normalizeWorkspaceTier', () => {
  it('maps starter to builder', () => {
    expect(normalizeWorkspaceTier('starter')).toBe('builder');
  });

  it('defaults unknown plans to builder', () => {
    expect(normalizeWorkspaceTier('unknown')).toBe('builder');
  });
});
