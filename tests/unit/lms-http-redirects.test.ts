import { describe, expect, it } from 'vitest';
import config from '../../apps/lms/next.config.mjs';
import { getRedirectStatus } from 'next/dist/lib/redirect-status';

describe('legacy portal navigation before streamed layouts', () => {
  it.each([
    ['/program-holder/portal/students', '/program-holder/students'],
    ['/program-holder/portal/reports', '/program-holder/reports'],
    ['/program-holder/portal/page', '/program-holder/dashboard'],
    ['/apprentice/attendance', '/apprentice/hours'],
  ])('%s resolves to its authenticated canonical route before rendering', async (source, destination) => {
    const redirects = (await config.redirects()).filter(route => route.source === source);
    expect(redirects).toHaveLength(1);
    expect(redirects[0].destination).toBe(destination);
    expect(getRedirectStatus(redirects[0])).toBe(307);
  });
});
