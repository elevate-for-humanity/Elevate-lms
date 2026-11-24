import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TenantCleaningProvider } from '@/components/tenant/TenantCleaningNetwork';

const auth = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn(), signInWithOtp: vi.fn(), readOnly: false }));
vi.mock('@/lib/supabase/client', () => ({ createClient: auth.createClient }));
vi.mock('@/components/tenant/TenantPreviewContext', () => ({ useTenantRequestHeaders: () => ({}), useReadOnlyTenantPreview: () => auth.readOnly }));
const fetchMock = vi.fn();
const success = (body: unknown) => ({ ok: true, json: async () => body });
const verificationRequired = () => ({ ok: false, json: async () => ({ error: 'Open a secure email sign-in link to access your cleaning provider profile.', code: 'provider_email_verification_required' }) });
const application = { id: '00000000-0000-4000-8000-000000000001', name: 'Cleaning Company', contactName: 'Applicant', createdAt: null, identityRevision: 'a'.repeat(64) };
const pendingProvider = { id: 'provider', lead_id: application.id, name: application.name, identityRevision: application.identityRevision, eligibility: 'pending', hourly_cents: 3500, zips: ['46204'], services: ['commercial'], opted_in: true };
const identityBody = { applicationId: application.id, confirmedBusinessName: application.name, identityRevision: application.identityRevision, identityConfirmed: true };
async function selectApplication(id = application.id) {
  fireEvent.change(await screen.findByRole('combobox', { name: 'Choose the network application you submitted' }), { target: { value: id } });
}
function confirmIdentity() { fireEvent.click(screen.getByRole('checkbox', { name: /I submitted this application and confirm/ })); }

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  auth.readOnly = false;
  auth.getUser.mockResolvedValue({ data: { user: { id: 'current-user', email: 'account@example.invalid', user_metadata: { email: 'spoofed@example.invalid' } } }, error: null });
  auth.signInWithOtp.mockResolvedValue({ error: null });
  auth.createClient.mockReturnValue({ auth: { getUser: auth.getUser, signInWithOtp: auth.signInWithOtp } });
  fetchMock.mockResolvedValue(success({ provider: null, applications: [application], jobs: [], jobOffersEnabled: false }));
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
    await screen.findByRole('combobox', { name: 'Choose the network application you submitted' });
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
    fetchMock.mockResolvedValueOnce(success({ provider: null, applications: [application], jobs: [], jobOffersEnabled: false }))
      .mockResolvedValueOnce(success({ provider: pendingProvider, saved: true }));
    render(<TenantCleaningProvider />);
    await selectApplication();
    const save = await screen.findByRole('button', { name: 'Save provider profile for review' });
    const consent = screen.getByRole('checkbox', { name: /I want job-opportunity emails/ });
    expect((consent as HTMLInputElement).checked).toBe(false);
    fireEvent.change(screen.getByRole('spinbutton', { name: /requested rate per cleaner-hour/i }), { target: { value: '35' } });
    fireEvent.change(screen.getByRole('textbox', { name: /ZIP codes you can serve/i }), { target: { value: '46204, 46201' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Commercial janitorial' }));
    fireEvent.click(consent);
    expect((save as HTMLButtonElement).disabled).toBe(true);
    confirmIdentity();
    fireEvent.submit(save.closest('form')!);
    await screen.findByText(/Provider profile saved for review/);
    const writes = fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0][1].body)).toEqual({ action: 'onboard', ...identityBody, hourlyCents: 3500, zips: ['46204', '46201'], services: ['commercial'], optedIn: true });
    expect(screen.getByText('Review status: Pending review.')).toBeTruthy();
    expect(screen.getByText(/Online job offers are not open yet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /accept.*job/i })).toBeNull();
  });

  it('does not show a provider form before a matching network application exists', async () => {
    fetchMock.mockResolvedValue(success({ provider: null, applications: [], jobs: [], jobOffersEnabled: false }));
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

  it('does not automatically select a public application, including a newer same-email submission', async () => {
    const other = { ...application, id: '00000000-0000-4000-8000-000000000003', name: 'Other Company', contactName: 'Other Contact', identityRevision: 'b'.repeat(64) };
    fetchMock.mockResolvedValue(success({ provider: null, applications: [other, application], jobs: [], jobOffersEnabled: false }));
    render(<TenantCleaningProvider />);
    const choice = await screen.findByRole('combobox', { name: 'Choose the network application you submitted' });
    expect((choice as HTMLSelectElement).value).toBe('');
    expect(screen.queryByRole('button', { name: 'Save provider profile for review' })).toBeNull();
    await selectApplication();
    expect(screen.getByRole('checkbox', { name: /confirm Cleaning Company/ })).toBeTruthy();
    confirmIdentity();
    expect((screen.getByRole('checkbox', { name: /I submitted this application/ }) as HTMLInputElement).checked).toBe(true);
    await selectApplication(other.id);
    expect((screen.getByRole('checkbox', { name: /confirm Other Company/ }) as HTMLInputElement).checked).toBe(false);
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  });

  it('requires identity confirmation for an existing owner-imported pending provider', async () => {
    fetchMock.mockResolvedValue(success({ provider: { ...pendingProvider, opted_in: false }, applications: [], jobs: [], jobOffersEnabled: false }));
    render(<TenantCleaningProvider />);
    const save = await screen.findByRole('button', { name: 'Save provider profile for review' });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(save.closest('form')!);
    await screen.findByText('Select your own application and confirm the displayed business name before saving.');
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
    confirmIdentity();
    expect((save as HTMLButtonElement).disabled).toBe(false);
  });

  it('lets a reviewed provider withdraw email consent explicitly without altering coverage or eligibility', async () => {
    fetchMock.mockResolvedValueOnce(success({ provider: { ...pendingProvider, eligibility: 'eligible' }, jobs: [], jobOffersEnabled: true }))
      .mockResolvedValueOnce(success({ provider: { ...pendingProvider, eligibility: 'eligible', opted_in: false }, saved: true }));
    render(<TenantCleaningProvider />);
    const save = await screen.findByRole('button', { name: 'Save email preference' });
    fireEvent.click(screen.getByRole('checkbox', { name: /I want job-opportunity emails/ }));
    confirmIdentity();
    fireEvent.submit(save.closest('form')!);
    await screen.findByText(/Job-opportunity emails are turned off/);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ action: 'consent', ...identityBody, optedIn: false });
    expect(screen.getByText('Review status: Approved.')).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: /ZIP codes/ })).toBeNull();
  });

  it('reports a review race honestly and refreshes to the reviewed profile without claiming withdrawal', async () => {
    fetchMock.mockResolvedValueOnce(success({ provider: pendingProvider, jobs: [], jobOffersEnabled: false }))
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Your review status changed. Refresh before editing your profile.' }) })
      .mockResolvedValueOnce(success({ provider: { ...pendingProvider, eligibility: 'eligible' }, jobs: [], jobOffersEnabled: false }));
    render(<TenantCleaningProvider />);
    const save = await screen.findByRole('button', { name: 'Save provider profile for review' });
    confirmIdentity();
    fireEvent.click(screen.getByRole('checkbox', { name: /I want job-opportunity emails/ }));
    fireEvent.submit(save.closest('form')!);
    await screen.findByText('Your review status changed. Refresh before editing your profile.');
    expect(screen.queryByText(/Provider profile saved|emails are turned off/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh profile' }));
    await screen.findByRole('button', { name: 'Save email preference' });
    expect(screen.getByText('Review status: Approved.')).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: /I want job-opportunity emails/ }) as HTMLInputElement).checked).toBe(true);
  });
});
