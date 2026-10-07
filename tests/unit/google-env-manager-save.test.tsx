import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EnvManagerClient from '@/apps/admin/app/integrations/env-manager/EnvManagerClient';

let verified = false;
const requests: Array<{ url: string; body?: { component: string } }> = [];
beforeEach(() => {
  verified = false;
  requests.length = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    requests.push({ url, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined });
    if (init?.method === 'POST') return Response.json({ configurationVerified: verified, runtimeSynced: verified, message: 'Verified Google runtime.' });
    return Response.json({ settings: [{ key: 'SENDGRID_API_KEY', value: '••••••••', is_secret: true, verification_status: 'unverified' }] });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function submit() {
  render(<EnvManagerClient />);
  await waitFor(() => expect(screen.queryByText('Loading settings…')).toBeNull());
  fireEvent.click(screen.getByText('Email — SendGrid'));
  const input = screen.getByPlaceholderText('••••••••');
  fireEvent.change(input, { target: { value: 'synthetic-private-value' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save (1)' }));
  return input;
}
it('keeps the entered value and refuses a green success notice when the backend has not verified delivery', async () => {
  const input = await submit();
  await screen.findByText('Google has not confirmed this configuration on the serving runtime.');
  expect((input as HTMLInputElement).value).toBe('synthetic-private-value');
  expect(screen.queryByText('Verified Google runtime.')).toBeNull();
});
it('sends the selected service and displays success only after verified delivery', async () => {
  verified = true;
  await submit();
  await screen.findByText('Verified Google runtime.');
  expect(requests.find(request => request.body)?.body?.component).toBe('admin');
  expect(screen.queryByText('Google has not confirmed this configuration on the serving runtime.')).toBeNull();
});
it('does not offer retired Northflank or Stripe configuration', async () => {
  render(<EnvManagerClient />);
  await waitFor(() => expect(screen.queryByText('Loading settings…')).toBeNull());
  expect(screen.queryByText('Northflank')).toBeNull();
  expect(screen.queryByText('Stripe')).toBeNull();
});
