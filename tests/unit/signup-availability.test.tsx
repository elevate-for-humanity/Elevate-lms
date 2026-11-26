import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({ settings: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: state.settings }) }) }),
  }),
}));
vi.mock('@/apps/lms/app/signup/SignupForm', () => ({
  default: () => <form aria-label="Create an account"><button>Create Account</button></form>,
}));

import SignupPage from '@/apps/lms/app/signup/page';

beforeEach(() => {
  vi.clearAllMocks();
  state.settings.mockResolvedValue({ data: { value: 'true' }, error: null });
});
afterEach(cleanup);

async function renderSignup() {
  render(await SignupPage({ searchParams: Promise.resolve({ next: '/community' }) }));
}

it('renders registration when signups are enabled', async () => {
  await renderSignup();
  expect(screen.getByRole('form', { name: 'Create an account' })).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it.each(['false', false])('withholds registration when the setting is %j while retaining the requested login destination', async value => {
  state.settings.mockResolvedValue({ data: { value }, error: null });
  await renderSignup();
  expect(screen.queryByRole('form', { name: 'Create an account' })).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Account registration is temporarily unavailable');
  expect(screen.getByRole('link', { name: 'Already have an account? Log in' }))
    .toHaveAttribute('href', '/login?redirect=%2Fcommunity');
});

it('preserves the existing available-by-default behavior when the setting is absent', async () => {
  state.settings.mockResolvedValue({ data: null, error: null });
  await renderSignup();
  expect(screen.getByRole('form', { name: 'Create an account' })).toBeInTheDocument();
});

it('preserves the existing fallback when settings cannot be read', async () => {
  state.settings.mockRejectedValue(new Error('settings unavailable'));
  await renderSignup();
  expect(screen.getByRole('form', { name: 'Create an account' })).toBeInTheDocument();
});
