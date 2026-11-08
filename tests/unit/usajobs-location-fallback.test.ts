// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/secrets', () => ({
  hydrateProcessEnv: async () => {},
  getSecrets: async () => ({
    USAJOBS_API_KEY: 'test-key',
    USAJOBS_USER_AGENT_EMAIL: 'test@example.com',
  }),
}));

import { fetchUsaJobs } from '@/lib/industry/usajobs';

const item = (title: string, id: string) => ({
  MatchedObjectId: id,
  MatchedObjectDescriptor: {
    PositionID: id,
    PositionTitle: title,
    OrganizationName: 'Test Agency',
    PositionURI: 'https://www.usajobs.gov/job/' + id,
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchUsaJobs location handling', () => {
  it('falls back to a nationwide search when the location filter yields nothing', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      // A bare state name over-narrows the query and returns nothing; the
      // nationwide retry must then return real federal postings.
      const empty = url.includes('LocationName=');
      return {
        ok: true,
        json: async () => ({
          SearchResult: {
            SearchResultItems: empty ? [] : [item('WELDER', '1')],
          },
        }),
      } as unknown as Response;
    });

    const jobs = await fetchUsaJobs('welder', 'Indiana', 5);
    expect(urls.length).toBe(2);
    expect(urls[0]).toContain('LocationName=Indiana');
    expect(urls[1]).not.toContain('LocationName=');
    expect(jobs.map((job) => job.title)).toEqual(['WELDER']);
  });

  it('does not retry nationwide when the located search already returned jobs', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return {
        ok: true,
        json: async () => ({
          SearchResult: { SearchResultItems: [item('REGISTERED NURSE', '2')] },
        }),
      } as unknown as Response;
    });

    const jobs = await fetchUsaJobs('nurse', 'Indiana', 5);
    expect(urls.length).toBe(1);
    expect(jobs.map((job) => job.title)).toEqual(['REGISTERED NURSE']);
  });

  it('does not issue a nationwide retry when no location was requested', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return {
        ok: true,
        json: async () => ({ SearchResult: { SearchResultItems: [] } }),
      } as unknown as Response;
    });

    const jobs = await fetchUsaJobs('welder', '', 5);
    expect(urls.length).toBe(1);
    expect(jobs).toEqual([]);
  });
});
