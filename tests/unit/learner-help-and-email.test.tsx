import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PARIS_PORTAL_ISSUE_EVENT } from '@/lib/paris/portal-support';
vi.mock('next/navigation', () => ({ usePathname: () => '/lms/dashboard' }));
vi.mock('@/components/paris/ParisChat', () => ({ default: () => <p>Student help is ready</p> }));
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('learner help and interoffice email', () => {
  it('keeps learner help closed even with auto-open enabled and opens only after Need help', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetcher);
    render(<ParisFloatingButton surface="learner" autoOpenOnDashboard />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() =>
      window.dispatchEvent(
        new CustomEvent(PARIS_PORTAL_ISSUE_EVENT, {
          detail: { workflow: 'documents', message: 'Upload failed' },
        }),
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Need help? Open PARIS' }));
    expect(await screen.findByText('Student help is ready')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close PARIS' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Need help? Open PARIS' })).toBeVisible();
  });

  for (const readOnly of [false, true])
    it(`prefills email only for a writable mailbox (readOnly=${readOnly})`, async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            readOnly,
            selectedMailboxId: 'student-mailbox',
            mailboxes: [
              {
                id: 'student-mailbox',
                address: 'student@example.test',
                displayName: 'Student',
                mailboxKind: 'individual',
              },
            ],
            threads: [],
            folders: [],
            drafts: [],
            filters: [],
          }),
        });
      vi.stubGlobal('fetch', fetcher);
      render(
        <EmailWorkspace
          initialRecipient="center.of.destiny@elevateforhumanity.org"
          initialSubject="Bookkeeping orientation introduction"
        />,
      );
      await screen.findAllByText('student@example.test');
      if (readOnly) expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      else {
        expect(await screen.findByRole('dialog', { name: 'Compose email' })).toBeInTheDocument();
        expect(
          screen.getByDisplayValue('center.of.destiny@elevateforhumanity.org'),
        ).toBeInTheDocument();
        expect(
          screen.getByDisplayValue('Bookkeeping orientation introduction'),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close composer' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      }
      expect(fetcher.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(
        true,
      );
    });
});
