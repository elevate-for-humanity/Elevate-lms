import { describe, expect, it, vi } from 'vitest';
import { retryableBrowserSessionRejection, startStudioBrowserSession } from '../../lib/devstudio/studio-browser-session-start';

const body = { url: 'https://example.com', width: 390, conversationId: 'conversation', taskId: 'task' };
const rejected = () => new Response(JSON.stringify({ error: 'Unavailable', retryable: true }), { status: 503 });
const accepted = () => new Response(JSON.stringify({ id: 'session', token: 'fixture', publicUrl: 'https://browser.example' }), { status: 200 });

describe('Studio browser session admission', () => {
  it('forwards only explicit native lifecycle retry hints', () => {
    for (const error of ['browser_unavailable', 'browser_recycling'])
      expect(retryableBrowserSessionRejection(503, { error, retryable: true })).toBe(true);
    for (const error of ['session_restore_failed', 'unauthorized', 'navigation_timeout', 'unknown'])
      expect(retryableBrowserSessionRejection(503, { error, retryable: true })).toBe(false);
    expect(retryableBrowserSessionRejection(503, { error: 'browser_unavailable', retryable: 'true' })).toBe(false);
    expect(retryableBrowserSessionRejection(502, { error: 'browser_unavailable', retryable: true })).toBe(false);
    expect(retryableBrowserSessionRejection(503, null)).toBe(false);
  });

  it('returns a successful admission without another request', async () => {
    const request = vi.fn(async () => accepted());
    const sleep = vi.fn(async (_ms: number) => {});
    const result = await startStudioBrowserSession({ body, request, sleep });
    expect(result?.response.status).toBe(200);
    expect(result?.payload.id).toBe('session');
    expect(request).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('recovers explicit rejected admissions with the same context and bounded backoff', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(rejected()).mockResolvedValueOnce(rejected()).mockResolvedValueOnce(accepted());
    const sleep = vi.fn(async (_ms: number) => {});
    const result = await startStudioBrowserSession({ body, request, sleep });
    expect(result?.payload.id).toBe('session');
    expect(request).toHaveBeenCalledTimes(3);
    for (const [url, init] of request.mock.calls) {
      expect(url).toBe('/api/admin/dev-studio/browser/session');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify(body));
    }
    expect(sleep.mock.calls.map(call => call[0])).toEqual([500, 1500]);
  });

  it('reports the last rejection after three attempts', async () => {
    const request = vi.fn(async () => rejected());
    const sleep = vi.fn(async (_ms: number) => {});
    const result = await startStudioBrowserSession({ body, request, sleep });
    expect(result?.response.status).toBe(503);
    expect(result?.payload.error).toBe('Unavailable');
    expect(request).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('does not repeat auth, capacity, other HTTP errors or missing retry hints', async () => {
    for (const [status, retryable] of [[401, true], [403, true], [409, true], [429, true], [500, true], [502, true], [504, true], [503, false], [503, 'true'], [503, undefined]] as const) {
      const request = vi.fn(async () => new Response(JSON.stringify({ retryable }), { status }));
      const sleep = vi.fn(async (_ms: number) => {});
      await startStudioBrowserSession({ body, request, sleep });
      expect(request).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    }
  });

  it('does not replay an ambiguous transport failure or malformed response', async () => {
    const request = vi.fn(async () => { throw Error('response lost'); });
    await expect(startStudioBrowserSession({ body, request })).rejects.toThrow('response lost');
    expect(request).toHaveBeenCalledTimes(1);
    const malformed = vi.fn(async () => new Response('not JSON', { status: 503 }));
    await expect(startStudioBrowserSession({ body, request: malformed })).rejects.toThrow();
    expect(malformed).toHaveBeenCalledTimes(1);
  });

  it('stops admission when its conversation or task lifecycle is superseded', async () => {
    let current = true;
    const request = vi.fn(async () => rejected());
    const result = await startStudioBrowserSession({ body, request, isCurrent: () => current, sleep: async () => { current = false; } });
    expect(result).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    const untouched = vi.fn(async () => accepted());
    expect(await startStudioBrowserSession({ body, request: untouched, isCurrent: () => false })).toBeNull();
    expect(untouched).not.toHaveBeenCalled();
  });

  it('ignores an admission response that arrives after the active context changes', async () => {
    let current = true;
    const request = vi.fn(async () => { current = false; return accepted(); });
    const sleep = vi.fn(async (_ms: number) => {});
    expect(await startStudioBrowserSession({ body, request, sleep, isCurrent: () => current })).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
