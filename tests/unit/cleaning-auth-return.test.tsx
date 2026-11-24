import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  assign: vi.fn(), replace: vi.fn(), fetch: vi.fn(), from: vi.fn(),
  exchange: vi.fn(), setSession: vi.fn(), getSession: vi.fn(), studentHome: vi.fn(),
  role: 'student', secondaryRoles: [] as string[], onboardingCompleted: false,
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: state.from,
    auth: {
      exchangeCodeForSession: state.exchange,
      setSession: state.setSession,
      getSession: state.getSession,
      signOut: vi.fn(),
    },
  }),
}));
vi.mock('@/lib/portal/resolve-student-home', () => ({ resolveStudentHomePath: state.studentHome }));

import LoginPage from '@/apps/lms/app/login/page';
import AuthCallbackPage from '@/apps/lms/app/auth/callback/page';
import { getRoleDestinationUrl } from '@/lib/auth/role-destinations';
import { siteUrls } from '@/lib/utils/site-urls';

const realWindow = window;
const provider = `${siteUrls.site}/sites/2exclusive-platinum-cleaning/provider?source=network`;
const booking = `${siteUrls.site}/sites/2exclusive-platinum-cleaning/book-cleaning`;
let currentUrl: URL;

function at(path: string, destination: string, parameter = 'next') {
  currentUrl = new URL(path, siteUrls.lms);
  currentUrl.searchParams.set(parameter, destination);
}

beforeEach(() => {
  vi.clearAllMocks();
  state.role = 'student'; state.secondaryRoles = []; state.onboardingCompleted = false;
  at('/login', provider);
  // Keep the real DOM/event APIs while observing actual full-page navigation.
  vi.stubGlobal('window', new Proxy(realWindow, {
    get: (target, key) => key === 'location'
      ? { href: currentUrl.href, search: currentUrl.search, hash: currentUrl.hash,
          origin: currentUrl.origin, pathname: currentUrl.pathname,
          assign: state.assign, replace: state.replace }
      : Reflect.get(target, key),
  }));
  vi.stubGlobal('fetch', state.fetch);
  state.fetch.mockResolvedValue({
    ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ success: true, user: { id: 'network-member' } }),
  });
  state.from.mockImplementation((table: string) => ({
    select: () => ({
      eq: () => table === 'profiles'
        ? { maybeSingle: async () => ({
            data: { role: state.role, portal_type: 'student', onboarding_completed: state.onboardingCompleted },
            error: null,
          }) }
        : Promise.resolve({ data: state.secondaryRoles.map(name => ({ roles: { name } })), error: null }),
    }),
  }));
  state.studentHome.mockResolvedValue(getRoleDestinationUrl('student'));
  state.exchange.mockResolvedValue({ error: null });
  state.setSession.mockResolvedValue({ error: null });
  state.getSession.mockResolvedValue({ data: { session: { user: { id: 'network-member', role: 'student' } } }, error: null });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function signIn() {
  render(<LoginPage />);
  const submit = await screen.findByRole('button', { name: 'Sign in' });
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'network@example.invalid' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'fixture-password' } });
  fireEvent.submit(submit.closest('form')!);
  await waitFor(() => expect(state.assign).toHaveBeenCalledTimes(1));
}

describe('shared business destinations after password sign-in', () => {
  it.each([provider, booking, '/community'])('returns the effective student to %s before learner-home routing', async destination => {
    at('/login', destination);
    await signIn();
    expect(state.assign).toHaveBeenCalledWith(destination.startsWith('/') ? `${siteUrls.lms}${destination}` : destination);
    expect(state.studentHome).not.toHaveBeenCalled();
    expect(state.from.mock.calls.map(([table]) => table)).toEqual(['profiles', 'user_roles']);
    expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', `/signup?redirect=${encodeURIComponent(destination)}`);
    const [url, request] = state.fetch.mock.calls[0];
    expect(url).toBe('/api/auth/signin');
    expect(JSON.parse(request.body)).toEqual({ email: 'network@example.invalid', password: 'fixture-password' });
  });

  it('preserves the trusted provider return before an employer onboarding default', async () => {
    state.role = 'employer'; state.secondaryRoles = ['student'];
    await signIn();
    expect(state.assign).toHaveBeenCalledWith(provider);
    expect(state.studentHome).not.toHaveBeenCalled();
  });

  it.each([
    '/employer/dashboard',
    `${siteUrls.site}/provider/dashboard`,
    `${siteUrls.site}/sites/other-tenant/provider`,
    'https://attacker.invalid/sites/2exclusive-platinum-cleaning/provider',
  ])('does not turn %s into authorized operating access', async destination => {
    at('/login', destination);
    await signIn();
    expect(state.assign).toHaveBeenCalledWith(getRoleDestinationUrl('student'));
  });
});

describe('verified signup and OAuth callback return', () => {
  it.each([provider, '/community'])('keeps %s after successful code exchange', async destination => {
    at('/auth/callback', destination);
    currentUrl.searchParams.set('code', 'fixture-auth-code');
    render(<AuthCallbackPage />);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith(destination));
    expect(state.exchange).toHaveBeenCalledWith('fixture-auth-code');
    expect(state.from).not.toHaveBeenCalled();
    expect(state.studentHome).not.toHaveBeenCalled();
  });

  it('keeps the trusted provider return after a verified fragment session', async () => {
    at('/auth/callback', provider, 'redirect');
    currentUrl.hash = 'access_token=fixture-access&refresh_token=fixture-refresh';
    render(<AuthCallbackPage />);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith(provider));
    expect(state.setSession).toHaveBeenCalledWith({ access_token: 'fixture-access', refresh_token: 'fixture-refresh' });
  });

  it('completes a valid session with a safe fallback when the requested path has malformed encoding', async () => {
    at('/auth/callback', '/%malformed');
    currentUrl.searchParams.set('code', 'fixture-auth-code');
    render(<AuthCallbackPage />);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith('/lms/dashboard'));
    expect(state.exchange).toHaveBeenCalledWith('fixture-auth-code');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves the requested provider destination in the retry link after failed code exchange', async () => {
    at('/auth/callback', provider);
    currentUrl.searchParams.set('code', 'expired-code');
    state.exchange.mockResolvedValue({ error: new Error('invalid code') });
    render(<AuthCallbackPage />);
    await screen.findByRole('alert');
    expect(state.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Return to secure login' })).toHaveAttribute('href', `/login?redirect=${encodeURIComponent(provider)}`);
  });

  it('rejects an external callback destination and preserves the safe fallback on failure', async () => {
    at('/auth/callback', 'https://attacker.invalid/provider');
    state.getSession.mockResolvedValue({ data: { session: null }, error: null });
    render(<AuthCallbackPage />);
    await screen.findByRole('alert');
    expect(screen.getByRole('link', { name: 'Return to secure login' })).toHaveAttribute('href', '/login?redirect=%2Flms%2Fdashboard');
    expect(state.replace).not.toHaveBeenCalled();
  });
});
