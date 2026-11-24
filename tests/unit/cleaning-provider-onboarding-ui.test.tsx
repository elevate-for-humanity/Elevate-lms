import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TenantCleaningProvider } from '@/components/tenant/TenantCleaningNetwork';

const auth = vi.hoisted(() => ({ createClient: vi.fn(), readOnly: false }));
vi.mock('@/lib/supabase/client', () => ({ createClient: auth.createClient }));
vi.mock('@/components/tenant/TenantPreviewContext', () => ({ useTenantRequestHeaders: () => ({}), useReadOnlyTenantPreview: () => auth.readOnly }));
const fetchMock = vi.fn();
const success = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const failure = (error: string, status = 403, code?: string) => ({ ok: false, status, json: async () => ({ error, code }) });
const verificationRequired = () => failure('Open a secure email verification link to access your cleaning provider profile.', 403, 'provider_email_verification_required');
const providerPath = '/sites/2exclusive-platinum-cleaning/provider';
const verificationPath = '/api/tenant-sites/cleaning/provider/verification';
const verificationButton = 'Email me a secure verification link';
const application = { id: '00000000-0000-4000-8000-000000000001', name: 'Cleaning Company', contactName: 'Applicant', createdAt: null, identityRevision: 'a'.repeat(64) };
const pendingProvider = { id: 'provider', lead_id: application.id, name: application.name, identityRevision: application.identityRevision, eligibility: 'pending', hourly_cents: 3500, zips: ['46204'], services: ['commercial'], opted_in: true };
const identityBody = { applicationId: application.id, confirmedBusinessName: application.name, identityRevision: application.identityRevision, identityConfirmed: true };
async function selectApplication(id = application.id) {
  fireEvent.change(await screen.findByRole('combobox', { name: 'Choose the network application you submitted' }), { target: { value: id } });
}
function confirmIdentity() { fireEvent.click(screen.getByRole('checkbox', { name: /I submitted this application and confirm/ })); }

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState({}, '', providerPath);
  auth.readOnly = false;
  auth.createClient.mockImplementation(() => { throw new Error('Provider verification must use the server endpoint.'); });
  fetchMock.mockResolvedValue(success({ provider: null, applications: [application], jobs: [], jobOffersEnabled: false }));
});
afterEach(() => { cleanup(); window.history.replaceState({}, '', providerPath); vi.unstubAllGlobals(); });

describe('cleaning provider profile workflow', () => {
  it('requests verification only on explicit action through the server without client-owned email or flow inputs', async () => {
    fetchMock.mockResolvedValueOnce(verificationRequired()).mockResolvedValueOnce(success({ sent: true }));
    render(<TenantCleaningProvider />);
    const send = await screen.findByRole('button', { name: verificationButton });
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(send);
    await screen.findByText(/Check your account email for the secure verification link/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]).toEqual([verificationPath, expect.objectContaining({
      method: 'POST', credentials: 'same-origin', body: '{}', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })]);
    expect(auth.createClient).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText(/Your email is verified/)).toBeNull();
  });

  it('reports an actual email service error without claiming a link was sent', async () => {
    fetchMock.mockResolvedValueOnce(verificationRequired())
      .mockResolvedValueOnce(failure('Email rate limit exceeded. Please try again later.', 429));
    render(<TenantCleaningProvider />);
    fireEvent.click(await screen.findByRole('button', { name: verificationButton }));
    await screen.findByText('Email rate limit exceeded. Please try again later.');
    expect(screen.queryByText(/Check your account email/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });

  it('requires the server to identify the session before reporting delivery', async () => {
    fetchMock.mockResolvedValueOnce(verificationRequired())
      .mockResolvedValueOnce(failure('Sign in with your account email before requesting a secure link.', 401));
    render(<TenantCleaningProvider />);
    fireEvent.click(await screen.findByRole('button', { name: verificationButton }));
    await screen.findByText('Sign in with your account email before requesting a secure link.');
    expect(screen.queryByText(/Check your account email/)).toBeNull();
    expect(screen.queryByRole('button', { name: verificationButton })).toBeNull();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(auth.createClient).not.toHaveBeenCalled();
  });

  it('never sends email from the read-only site preview', async () => {
    fetchMock.mockResolvedValue(verificationRequired());
    auth.readOnly = true;
    render(<TenantCleaningProvider />);
    const send = await screen.findByRole('button', { name: verificationButton });
    expect((send as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(send);
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
    expect(auth.createClient).not.toHaveBeenCalled();
  });

  it('does not claim delivery without the server sent receipt', async () => {
    fetchMock.mockResolvedValueOnce(verificationRequired()).mockResolvedValueOnce(success({ sent: false }));
    render(<TenantCleaningProvider />);
    fireEvent.click(await screen.findByRole('button', { name: verificationButton }));
    await screen.findByText('The verification link could not be requested. Please try again.');
    expect(screen.queryByText(/Check your account email/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });

  it('disables repeat delivery requests while the server request is pending', async () => {
    let complete!: (value: ReturnType<typeof success>) => void;
    const request = new Promise(resolve => { complete = resolve; });
    fetchMock.mockResolvedValueOnce(verificationRequired()).mockReturnValueOnce(request);
    render(<TenantCleaningProvider />);
    fireEvent.click(await screen.findByRole('button', { name: verificationButton }));
    const busy = await screen.findByRole('button', { name: 'Requesting link…' });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(busy);
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
    await act(async () => complete(success({ sent: true })));
    await screen.findByText(/Check your account email/);
  });

  it.each([
    ['expired', 'This verification link has expired or was already used. Request a new link and open it in this browser.'],
    ['wrong_browser', 'Open the verification link in the same browser where you requested it. To continue in this browser, request a new link here.'],
    ['failed', 'We could not verify your email with that link. Request a new link and try again.'],
  ])('shows fixed %s callback feedback without hiding it behind the profile authorization response', async (status, message) => {
    window.history.replaceState({}, '', `${providerPath}?provider_email_verification=${status}`);
    fetchMock.mockResolvedValue(verificationRequired());
    render(<TenantCleaningProvider />);
    await screen.findByRole('button', { name: verificationButton });
    expect(screen.getByRole('alert').textContent).toBe(message);
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    expect(window.location.search).toBe('');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(auth.createClient).not.toHaveBeenCalled();
  });

  it('accepts a success callback only after the profile API proves access and reloads the saved profile', async () => {
    window.history.replaceState({}, '', `${providerPath}?provider_email_verification=success&view=profile#details`);
    let complete!: (value: ReturnType<typeof success>) => void;
    fetchMock.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
    render(<TenantCleaningProvider />);
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    expect(screen.queryByText(/Your email is verified/)).toBeNull();
    await act(async () => complete(success({ provider: pendingProvider, jobs: [], jobOffersEnabled: false })));
    await screen.findByRole('button', { name: 'Save provider profile for review' });
    expect(screen.getByText('Your email is verified. Continue with your provider profile below.')).toBeTruthy();
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('35.00');
    expect(window.location.search).toBe('?view=profile');
    expect(window.location.hash).toBe('#details');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not let a forged success callback bypass server proof', async () => {
    window.history.replaceState({}, '', `${providerPath}?provider_email_verification=success`);
    fetchMock.mockResolvedValue(verificationRequired());
    render(<TenantCleaningProvider />);
    await screen.findByRole('button', { name: verificationButton });
    expect(screen.queryByText(/Your email is verified/)).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });

  it('ignores unknown callback values without rendering them or treating them as authority', async () => {
    const untrusted = 'untrusted-email@example.invalid';
    window.history.replaceState({}, '', `${providerPath}?provider_email_verification=${encodeURIComponent(untrusted)}`);
    fetchMock.mockResolvedValue(verificationRequired());
    render(<TenantCleaningProvider />);
    await screen.findByRole('button', { name: verificationButton });
    expect(screen.queryByText(untrusted)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('refreshes after delivery and exposes the form only when the server accepts the completed proof', async () => {
    fetchMock.mockResolvedValueOnce(verificationRequired())
      .mockResolvedValueOnce(success({ sent: true }))
      .mockResolvedValueOnce(success({ provider: pendingProvider, jobs: [], jobOffersEnabled: false }));
    render(<TenantCleaningProvider />);
    fireEvent.click(await screen.findByRole('button', { name: verificationButton }));
    await screen.findByText(/Check your account email/);
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh profile' }));
    await screen.findByRole('button', { name: 'Save provider profile for review' });
    expect(screen.getByText('Your email is verified. Continue with your provider profile below.')).toBeTruthy();
    expect(screen.queryByText(/Check your account email/)).toBeNull();
    expect(screen.queryByRole('button', { name: verificationButton })).toBeNull();
    expect(fetchMock.mock.calls[2][1].method).toBe('GET');
    expect(auth.createClient).not.toHaveBeenCalled();
  });

  it.each([
    ['mailbox proof', verificationRequired, true],
    ['the authenticated session', () => failure('Sign in again to continue.', 401), false],
  ])('hides previously loaded provider and assignment data if %s is lost during a save', async (_reason, denied, canVerify) => {
    fetchMock.mockResolvedValueOnce(success({ provider: { ...pendingProvider, eligibility: 'eligible' }, jobs: [{ id: 'job', service: 'commercial', starts_at: '2026-11-25T12:00:00Z', status: 'assigned', customer_name: 'Private Customer', customer_email: 'private@example.invalid', provider_pay_cents: 3500, private_details: 'Private address' }], jobOffersEnabled: true }))
      .mockResolvedValueOnce(denied());
    render(<TenantCleaningProvider />);
    const save = await screen.findByRole('button', { name: 'Save hourly rate' });
    expect(screen.getByText('Private address')).toBeTruthy();
    fireEvent.submit(save.closest('form')!);
    if (canVerify) await screen.findByRole('button', { name: verificationButton });
    else {
      await screen.findByText('Sign in again to continue.');
      expect(screen.queryByRole('button', { name: verificationButton })).toBeNull();
      expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    }
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
