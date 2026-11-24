import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TenantCleaningProvider } from '@/components/tenant/TenantCleaningNetwork';

const auth = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn(), signInWithOtp: vi.fn(), readOnly: false }));
vi.mock('@/lib/supabase/client', () => ({ createClient: auth.createClient }));
vi.mock('@/components/tenant/TenantPreviewContext', () => ({ useTenantRequestHeaders: () => ({}), useReadOnlyTenantPreview: () => auth.readOnly }));
const fetchMock = vi.fn();
const success = (body: unknown) => ({ ok: true, json: async () => body });
const verificationRequired = () => ({ ok: false, json: async () => ({ error: 'Open a secure email sign-in link to access your cleaning provider profile.', code: 'provider_email_verification_required' }) });
const pendingProvider = { id: 'provider', name: 'Cleaning Company', eligibility: 'pending', hourly_cents: 3500, zips: ['46204'], services: ['commercial'], opted_in: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  auth.readOnly = false;
  auth.getUser.mockResolvedValue({ data: { user: { id: 'current-user', email: 'account@example.invalid', user_metadata: { email: 'spoofed@example.invalid' } } }, error: null });
  auth.signInWithOtp.mockResolvedValue({ error: null });
  auth.createClient.mockReturnValue({ auth: { getUser: auth.getUser, signInWithOtp: auth.signInWithOtp } });
  fetchMock.mockResolvedValue(success({ provider: null, application: { name: 'Applicant' }, jobs: [], jobOffersEnabled: false }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('cleaning provider profile workflow', () => {
  it('requests an email-specific sign-in link only on explicit action, using the current account and fixed provider return', async () => {
    fetchMock.mockResolvedValue(verificationRequired());
    render(<TenantCleaningProvider />);
    const send = await screen.findByRole('button', { name: 'Email me a secure sign-in link' });
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    expect(auth.getUser).not.toHaveBeenCalled();
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
    fireEvent.click(send);
    await screen.findByText(/Check your account email for the secure sign-in link/);
    expect(auth.signInWithOtp).toHaveBeenCalledTimes(1);
    const sent = auth.signInWithOtp.mock.calls[0][0];
    expect(sent.email).toBe('account@example.invalid');
    expect(sent.options.shouldCreateUser).toBe(false);
    const callback = new URL(sent.options.emailRedirectTo);
    expect(callback.origin).toBe('https://lms.elevateforhumanity.org');
    expect(callback.pathname).toBe('/auth/callback');
    expect(callback.searchParams.get('redirect')).toBe('https://www.elevateforhumanity.org/sites/2exclusive-platinum-cleaning/provider');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  });

  it('reports an actual email service error without claiming a link was sent', async () => {
    fetchMock.mockResolvedValue(verificationRequired());
    auth.signInWithOtp.mockResolvedValue({ error: new Error('Email rate limit exceeded. Please try again later.') });
    render(<TenantCleaningProvider />);
    fireEvent.click(await screen.findByRole('button', { name: 'Email me a secure sign-in link' }));
    await screen.findByText('Email rate limit exceeded. Please try again later.');
    expect(screen.queryByText(/Check your account email/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });

  it('does not send to an unverified client identity when the account lookup fails', async () => {
    fetchMock.mockResolvedValue(verificationRequired());
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Session expired') });
    render(<TenantCleaningProvider />);
    fireEvent.click(await screen.findByRole('button', { name: 'Email me a secure sign-in link' }));
    await screen.findByText('Sign in with your account email before requesting a secure link.');
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('never sends email from the read-only site preview', async () => {
    fetchMock.mockResolvedValue(verificationRequired());
    auth.readOnly = true;
    render(<TenantCleaningProvider />);
    const send = await screen.findByRole('button', { name: 'Email me a secure sign-in link' });
    expect((send as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(send);
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('hides previously loaded provider and assignment data if mailbox proof is lost during a save', async () => {
    fetchMock.mockResolvedValueOnce(success({ provider: { ...pendingProvider, eligibility: 'eligible' }, jobs: [{ id: 'job', service: 'commercial', starts_at: '2026-11-25T12:00:00Z', status: 'assigned', customer_name: 'Private Customer', customer_email: 'private@example.invalid', provider_pay_cents: 3500, private_details: 'Private address' }], jobOffersEnabled: true }))
      .mockResolvedValueOnce(verificationRequired());
    render(<TenantCleaningProvider />);
    const save = await screen.findByRole('button', { name: 'Save hourly rate' });
    expect(screen.getByText('Private address')).toBeTruthy();
    fireEvent.submit(save.closest('form')!);
    await screen.findByRole('button', { name: 'Email me a secure sign-in link' });
    expect(screen.queryByText('Private address')).toBeNull();
    expect(screen.queryByText('Cleaning Company')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save hourly rate' })).toBeNull();
  });

  it('keeps the trusted full provider return URL for sign-in and signup and links the existing network and community', async () => {
    render(<TenantCleaningProvider />);
    await screen.findByRole('button', { name: 'Save provider profile for review' });
    const destination = 'https://www.elevateforhumanity.org/sites/2exclusive-platinum-cleaning/provider';
    for (const name of ['Sign in', 'Create an account']) {
      const url = new URL(screen.getByRole('link', { name }).getAttribute('href')!);
      expect(url.origin).toBe('https://lms.elevateforhumanity.org');
      expect(url.searchParams.get('next')).toBe(destination);
    }
    expect(screen.getByRole('link', { name: 'Cleaning network application' }).getAttribute('href')).toBe('https://www.elevateforhumanity.org/sites/2exclusive-platinum-cleaning/join-network');
    expect(screen.getByRole('link', { name: 'Open the community' }).getAttribute('href')).toBe('https://lms.elevateforhumanity.org/community');
  });

  it('lets an existing applicant explicitly choose rate, coverage, services and email consent without claiming approval', async () => {
    fetchMock.mockResolvedValueOnce(success({ provider: null, application: { name: 'Applicant' }, jobs: [], jobOffersEnabled: false }))
      .mockResolvedValueOnce(success({ provider: pendingProvider, saved: true }));
    render(<TenantCleaningProvider />);
    const save = await screen.findByRole('button', { name: 'Save provider profile for review' });
    const consent = screen.getByRole('checkbox', { name: /I want job-opportunity emails/ });
    expect((consent as HTMLInputElement).checked).toBe(false);
    fireEvent.change(screen.getByRole('spinbutton', { name: /requested rate per cleaner-hour/i }), { target: { value: '35' } });
    fireEvent.change(screen.getByRole('textbox', { name: /ZIP codes you can serve/i }), { target: { value: '46204, 46201' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Commercial janitorial' }));
    fireEvent.click(consent);
    fireEvent.submit(save.closest('form')!);
    await screen.findByText(/Provider profile saved for review/);
    const writes = fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0][1].body)).toEqual({ action: 'onboard', hourlyCents: 3500, zips: ['46204', '46201'], services: ['commercial'], optedIn: true });
    expect(screen.getByText('Review status: Pending review.')).toBeTruthy();
    expect(screen.getByText(/Online job offers are not open yet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /accept.*job/i })).toBeNull();
  });

  it('does not show a provider form before a matching network application exists', async () => {
    fetchMock.mockResolvedValue(success({ provider: null, application: null, jobs: [], jobOffersEnabled: false }));
    render(<TenantCleaningProvider />);
    await screen.findByText(/Submit the cleaning network application with your verified account email/);
    expect(screen.queryByRole('button', { name: 'Save provider profile for review' })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps a reviewed provider on the narrow rate-update path', async () => {
    fetchMock.mockResolvedValueOnce(success({ provider: { ...pendingProvider, eligibility: 'eligible' }, jobs: [], jobOffersEnabled: true }))
      .mockResolvedValueOnce(success({ saved: true }));
    render(<TenantCleaningProvider />);
    const save = await screen.findByRole('button', { name: 'Save hourly rate' });
    expect(screen.queryByRole('textbox', { name: /ZIP codes/ })).toBeNull();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '40' } });
    fireEvent.submit(save.closest('form')!);
    await screen.findByText(/Rate saved for future opportunities/);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ hourlyCents: 4000 });
    expect(screen.getByText('Review status: Approved.')).toBeTruthy();
  });

  it('reports load failure and keeps the sign-in route available without showing a false saved status', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Sign in with a verified email to continue.' }) });
    render(<TenantCleaningProvider />);
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Sign in with a verified email'));
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });
});
