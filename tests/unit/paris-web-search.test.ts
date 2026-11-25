import { describe, expect, it, vi } from 'vitest';

import {
  formatWebResults,
  searchWebForParis,
  selectWebSearchProvider,
  shouldWebSearch,
} from '@/lib/ai/paris-web-search';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe('PARIS web search provider selection', () => {
  it('prefers Tavily when its key is set', () => {
    expect(selectWebSearchProvider({ TAVILY_API_KEY: 'tvly-x', BRAVE_SEARCH_API_KEY: 'brave-x' })).toBe('tavily');
  });

  it('uses Brave when only its key is set', () => {
    expect(selectWebSearchProvider({ BRAVE_SEARCH_API_KEY: 'brave-x' })).toBe('brave');
  });

  it('falls back to keyless with no keys, and ignores blank keys', () => {
    expect(selectWebSearchProvider({})).toBe('keyless');
    expect(selectWebSearchProvider({ TAVILY_API_KEY: '  ', BRAVE_SEARCH_API_KEY: '' })).toBe('keyless');
  });
});

describe('PARIS web search trigger', () => {
  it('searches when no program matched the question', () => {
    expect(shouldWebSearch('What is the difference between a CNA and a home health aide?', 0)).toBe(true);
    expect(shouldWebSearch('How do I renew an Indiana driver license?', 0)).toBe(true);
  });

  it('does not search when a program matched and the question is about the program', () => {
    expect(shouldWebSearch('how much is barber school and how long does it take', 1)).toBe(false);
    expect(shouldWebSearch('What do I need to do to get EPA 608 certified for HVAC work?', 1)).toBe(false);
    expect(shouldWebSearch('When does the next CNA class start and is funding available?', 2)).toBe(false);
  });

  it('searches when a matched question asks about the outside world', () => {
    expect(shouldWebSearch('How much does an HVAC technician earn in Indiana?', 1)).toBe(true);
    expect(shouldWebSearch('What is the average salary for a barber?', 1)).toBe(true);
    expect(shouldWebSearch('What are the Indiana license requirements for cosmetology?', 1)).toBe(true);
    expect(shouldWebSearch('What is the difference between EPA 608 Type II and Type III?', 1)).toBe(true);
  });

  it('never searches for greetings or one-word replies', () => {
    expect(shouldWebSearch('hi', 0)).toBe(false);
    expect(shouldWebSearch('Thanks!', 0)).toBe(false);
    expect(shouldWebSearch('ok', 0)).toBe(false);
    expect(shouldWebSearch('', 0)).toBe(false);
  });
});

describe('PARIS web search formatting', () => {
  it('formats numbered results with title, source URL, and snippet', () => {
    const text = formatWebResults([
      { title: 'Section 608', snippet: 'EPA technician certification rules.', url: 'https://en.wikipedia.org/wiki/Section_608' },
      { title: 'CNA Guide', snippet: 'How certification works.', url: 'https://example.com/cna' },
    ]);
    expect(text).toContain('1. Section 608 — https://en.wikipedia.org/wiki/Section_608');
    expect(text).toContain('EPA technician certification rules.');
    expect(text).toContain('2. CNA Guide — https://example.com/cna');
  });

  it('formats nothing for no results', () => {
    expect(formatWebResults([])).toBe('');
  });
});

describe('PARIS web search providers (mocked fetch)', () => {
  it('queries Tavily and maps its results when the Tavily key is set', async () => {
    const fetcher = vi.fn(async (url: string, _init?: RequestInit) => {
      expect(url).toBe('https://api.tavily.com/search');
      return jsonResponse({
        results: [
          { title: 'Indiana CNA Registry', content: 'Indiana requires 105 hours of training.', url: 'https://www.in.gov/cna' },
        ],
      });
    });
    const results = await searchWebForParis('Indiana CNA requirements', {
      env: { TAVILY_API_KEY: 'tvly-test' },
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(results).toEqual([
      { title: 'Indiana CNA Registry', snippet: 'Indiana requires 105 hours of training.', url: 'https://www.in.gov/cna' },
    ]);
    const body = JSON.parse((fetcher.mock.calls[0][1] as RequestInit).body as string);
    expect(body.query).toBe('Indiana CNA requirements');
    expect(body.api_key).toBe('tvly-test');
  });

  it('queries Brave with the subscription-token header when only the Brave key is set', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain('https://api.search.brave.com/res/v1/web/search');
      expect((init?.headers as Record<string, string>)['X-Subscription-Token']).toBe('brave-test');
      return jsonResponse({
        web: { results: [{ title: 'Brave Result', description: 'A description.', url: 'https://example.com/a' }] },
      });
    });
    const results = await searchWebForParis('barber salary', {
      env: { BRAVE_SEARCH_API_KEY: 'brave-test' },
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(results).toEqual([{ title: 'Brave Result', snippet: 'A description.', url: 'https://example.com/a' }]);
  });

  it('keyless path merges a DuckDuckGo abstract with Wikipedia results and strips markup', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.startsWith('https://api.duckduckgo.com/')) {
        return jsonResponse({
          Heading: 'Section 608',
          AbstractText: 'Section 608 is the EPA technician certification program.',
          AbstractURL: 'https://en.wikipedia.org/wiki/Section_608',
          Answer: '',
          Definition: '',
          RelatedTopics: [],
        });
      }
      if (url.startsWith('https://en.wikipedia.org/')) {
        return jsonResponse({
          query: {
            search: [
              {
                title: 'Refrigerant reclamation',
                snippet: 'third party <span class="searchmatch">testing</span> and &quot;certification&quot; programs',
              },
            ],
          },
        });
      }
      throw new Error(`unexpected url ${url}`);
    });
    const results = await searchWebForParis('EPA 608 certification', {
      env: {},
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(results[0]).toEqual({
      title: 'Section 608',
      snippet: 'Section 608 is the EPA technician certification program.',
      url: 'https://en.wikipedia.org/wiki/Section_608',
    });
    // The Wikipedia result has its own page URL, so both survive dedupe.
    expect(results[1].title).toBe('Refrigerant reclamation');
    expect(results[1].snippet).toBe('third party testing and "certification" programs');
    expect(results[1].url).toBe('https://en.wikipedia.org/wiki/Refrigerant_reclamation');
    expect(results.length).toBe(2);
  });

  it('keyless path still returns Wikipedia results when DuckDuckGo is empty', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.startsWith('https://api.duckduckgo.com/')) {
        return jsonResponse({ AbstractText: '', Answer: '', Definition: '', RelatedTopics: [] });
      }
      return jsonResponse({
        query: { search: [{ title: 'Workforce Innovation and Opportunity Act', snippet: 'WIOA is a federal law.' }] },
      });
    });
    const results = await searchWebForParis('what is WIOA', {
      env: {},
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Workforce Innovation');
  });

  it('caps the result count and trims long snippets', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        results: Array.from({ length: 7 }, (_, i) => ({
          title: `Result ${i}`,
          content: 'x'.repeat(500),
          url: `https://example.com/${i}`,
        })),
      }),
    );
    const results = await searchWebForParis('anything at all', {
      env: { TAVILY_API_KEY: 'tvly-test' },
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(results).toHaveLength(4);
    expect(results[0].snippet.length).toBeLessThanOrEqual(240);
  });
});

describe('PARIS web search fail-open behavior', () => {
  it('returns [] when the provider request throws', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network down');
    });
    await expect(
      searchWebForParis('anything', { env: { TAVILY_API_KEY: 'k' }, fetcher: fetcher as unknown as typeof fetch }),
    ).resolves.toEqual([]);
  });

  it('returns [] on an HTTP error status', async () => {
    const fetcher = vi.fn(async () => jsonResponse({}, false, 500));
    await expect(
      searchWebForParis('anything', { env: {}, fetcher: fetcher as unknown as typeof fetch }),
    ).resolves.toEqual([]);
  });

  it('returns [] when the provider hangs past the timeout', async () => {
    const fetcher = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const started = Date.now();
    const results = await searchWebForParis('anything', {
      env: { TAVILY_API_KEY: 'k' },
      fetcher: fetcher as unknown as typeof fetch,
      timeoutMs: 60,
    });
    expect(results).toEqual([]);
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('returns [] for an empty query without calling fetch', async () => {
    const fetcher = vi.fn(async () => jsonResponse({}));
    await expect(searchWebForParis('   ', { env: {}, fetcher: fetcher as unknown as typeof fetch })).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
