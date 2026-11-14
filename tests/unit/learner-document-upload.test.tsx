import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DocumentUploadPage from '@/apps/lms/app/lms/(app)/documents/upload/page';

const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('requirement=owned-requirement'),
  useRouter: () => ({ push, refresh }),
}));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
async function submit() {
  const view = render(<DocumentUploadPage />);
  fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit for review' })).toBeEnabled());
}
describe('learner document upload recovery', () => {
  it('keeps the form usable after a lost connection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent('Check your connection');
    expect(push).not.toHaveBeenCalled();
  });
  it('does not mistake a redirected login response for a successful upload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ redirected: true, status: 200 }));
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent('session expired');
    expect(push).not.toHaveBeenCalled();
  });
  it('requires a confirmed saved record before navigating away', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent('could not be confirmed');
    expect(push).not.toHaveBeenCalled();
  });
  it('returns to documents only after the server confirms success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    await submit();
    expect(push).toHaveBeenCalledWith('/lms/documents');
    expect(refresh).toHaveBeenCalledOnce();
  });
});
