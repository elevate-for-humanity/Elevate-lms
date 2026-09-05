// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  authorizeOneRoster,
  isOneRosterEnabled,
  issueOneRosterToken,
  oneRosterPagination,
  validateOneRosterClient,
} from '@/lib/integrations/oneroster/auth';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.ONEROSTER_ENABLED = 'true';
  process.env.ONEROSTER_CLIENT_ID = 'edlink-client';
  process.env.ONEROSTER_CLIENT_SECRET = 'test-client-secret';
  process.env.ONEROSTER_TOKEN_SECRET = 'test-token-secret-with-more-than-32-bytes';
  process.env.ONEROSTER_ISSUER = 'https://app.elevateforhumanity.org';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('OneRoster client-credentials security', () => {
  it('stays disabled unless explicitly enabled', () => {
    process.env.ONEROSTER_ENABLED = 'false';
    expect(isOneRosterEnabled()).toBe(false);
    expect(validateOneRosterClient('edlink-client', 'test-client-secret')).toBe(false);
  });

  it('stays disabled when required credentials are incomplete', () => {
    delete process.env.ONEROSTER_CLIENT_SECRET;
    expect(isOneRosterEnabled()).toBe(false);
  });

  it('rejects incorrect client credentials', () => {
    expect(validateOneRosterClient('edlink-client', 'wrong')).toBe(false);
  });

  it('issues a short-lived scoped token accepted by the resource guard', async () => {
    const token = await issueOneRosterToken('edlink-client');
    const request = new Request('https://app.elevateforhumanity.org/api/oneroster/v1p2/orgs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(await authorizeOneRoster(request)).toBe(true);
  });

  it('rejects an invalid bearer token', async () => {
    const request = new Request('https://app.elevateforhumanity.org/api/oneroster/v1p2/orgs', {
      headers: { Authorization: 'Bearer invalid' },
    });
    expect(await authorizeOneRoster(request)).toBe(false);
  });
});

describe('OneRoster pagination', () => {
  it('clamps limit and offset to safe values', () => {
    const result = oneRosterPagination(
      new Request('https://app.elevateforhumanity.org/api/oneroster/v1p2/users?limit=9999&offset=-5'),
    );
    expect(result).toEqual({ limit: 500, offset: 0 });
  });
});
