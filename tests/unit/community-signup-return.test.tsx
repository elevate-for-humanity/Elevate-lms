import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  params: new URLSearchParams(), signUp: vi.fn(), resend: vi.fn(), oauth: vi.fn(), push: vi.fn(), refresh: vi.fn(),
}));
vi.mock('@/hooks/useSafeSearchParams', () => ({ useSafeSearchParams: () => state.params }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push, refresh: state.refresh }) }));
vi.mock('@/lib/supabase/public-config', () => ({ isSupabaseAuthConfigured: () => true }));
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({ auth: { signUp: state.signUp, resend: state.resend, signInWithOAuth: state.oauth } }),
}));
import SignupForm from '@/apps/lms/app/signup/SignupForm';

beforeEach(() => {
  vi.clearAllMocks();
  state.params = new URLSearchParams({ next: '/community' });
  state.signUp.mockResolvedValue({ data: { session: null, user: { id: 'new-network-member' } }, error: null });
  state.resend.mockResolvedValue({ error: null });
  state.oauth.mockResolvedValue({ error: null });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Network' } });
  fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Member' } });
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'network@fixture.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'lantern-river-meadow' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'lantern-river-meadow' } });
  fireEvent.change(screen.getByLabelText('I am interested in'), { target: { value: 'employer' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.submit(screen.getByRole('button', { name: 'Create Account', exact: true }).closest('form')!);
}
function expectCallback(value: string, destination = '/community') {
  const url = new URL(value);
  expect(url.origin).toBe(window.location.origin);
  expect(url.pathname).toBe('/auth/callback');
  expect(url.searchParams.get('next')).toBe(destination);
}

it('keeps the community destination in verification and stores employer interest without granting a role', async () => {
  render(<SignupForm />);
  expect(screen.getByLabelText('I am interested in')).toHaveValue('community');
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login?redirect=%2Fcommunity');
  fillAndSubmit();
  await screen.findByText('Account Created!');
  const request = state.signUp.mock.calls[0][0];
  expectCallback(request.options.emailRedirectTo);
  expect(request.options.data.requested_role).toBe('employer');
  expect(request.options.data).not.toHaveProperty('role');
  expect(request).not.toHaveProperty('app_metadata');
  expect(screen.getByRole('link', { name: 'Already verified? Go to Login' })).toHaveAttribute('href', '/login?redirect=%2Fcommunity');
  expect(screen.getByText(/operating access requires Elevate approval/)).toBeInTheDocument();
});

it('retains the destination when resending verification', async () => {
  render(<SignupForm />); fillAndSubmit(); await screen.findByText('Account Created!');
  fireEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));
  await screen.findByText('Email resent ✓');
  expectCallback(state.resend.mock.calls[0][0].options.emailRedirectTo);
});

it('reports a resend failure without claiming an email was sent', async () => {
  state.resend.mockResolvedValue({ error: new Error('upstream unavailable') });
  render(<SignupForm />); fillAndSubmit(); await screen.findByText('Account Created!');
  fireEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('Email resent ✓')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resend verification email' })).toBeEnabled();
  state.resend.mockResolvedValue({ error: null });
  fireEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));
  await screen.findByText('Email resent ✓');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it.each(['Google', 'GitHub'])('preserves the community return through %s OAuth', async provider => {
  render(<SignupForm />);
  fireEvent.click(screen.getByRole('button', { name: `Sign up with ${provider}` }));
  await waitFor(() => expect(state.oauth).toHaveBeenCalled());
  expectCallback(state.oauth.mock.calls[0][0].options.redirectTo);
});

it.each(['https://untrusted.invalid/community', '//untrusted.invalid', '/%malformed'])('rejects unsafe or malformed return destination %s', async destination => {
  state.params = new URLSearchParams({ next: destination });
  render(<SignupForm />);
  fireEvent.click(screen.getByRole('button', { name: 'Sign up with Google' }));
  await waitFor(() => expect(state.oauth).toHaveBeenCalled());
  expectCallback(state.oauth.mock.calls[0][0].options.redirectTo, '/lms/dashboard');
});

it('uses the legacy redirect parameter when supplied', async () => {
  state.params = new URLSearchParams({ redirect: '/community' });
  render(<SignupForm />); fillAndSubmit(); await screen.findByText('Account Created!');
  expectCallback(state.signUp.mock.calls[0][0].options.emailRedirectTo);
});

it('retains the full trusted cleaning-provider return in verification, resend, OAuth and the login link', async () => {
  const destination = 'https://www.elevateforhumanity.org/sites/2exclusive-platinum-cleaning/provider?source=network';
  state.params = new URLSearchParams({ next: destination });
  render(<SignupForm />);
  fireEvent.click(screen.getByRole('button', { name: 'Sign up with Google' }));
  await waitFor(() => expect(state.oauth).toHaveBeenCalled());
  expectCallback(state.oauth.mock.calls[0][0].options.redirectTo, destination);
  fillAndSubmit();
  await screen.findByText('Account Created!');
  expectCallback(state.signUp.mock.calls[0][0].options.emailRedirectTo, destination);
  fireEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));
  await screen.findByText('Email resent ✓');
  expectCallback(state.resend.mock.calls[0][0].options.emailRedirectTo, destination);
  expect(screen.getByRole('link', { name: 'Already verified? Go to Login' })).toHaveAttribute('href', `/login?redirect=${encodeURIComponent(destination)}`);
});

it('continues an immediately authenticated signup to community without claiming verification is needed', async () => {
  vi.useFakeTimers();
  state.signUp.mockResolvedValue({ data: { session: { user: { id: 'new-network-member' } } }, error: null });
  render(<SignupForm />);
  await act(async () => { fillAndSubmit(); });
  expect(screen.getByText('Your account is ready. Continuing to your requested page…')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Resend verification email' })).not.toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(state.push).toHaveBeenCalledWith('/community');
});
