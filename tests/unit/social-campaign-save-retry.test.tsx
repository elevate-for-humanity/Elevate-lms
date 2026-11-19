import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
import NewSocialCampaignClient from '@/apps/admin/app/social-media/campaigns/new/NewSocialCampaignClient';
afterEach(() => { vi.unstubAllGlobals(); state.push.mockClear(); });

it('reuses the exact save request UUID when a failed save is retried', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Temporary failure' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ draftCount: 0, replayed: true }) });
  vi.stubGlobal('fetch', fetchMock);
  render(<NewSocialCampaignClient />);
  fireEvent.click(screen.getByRole('button', { name: 'Save campaign draft' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save campaign draft' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Save campaign draft' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const first = JSON.parse(fetchMock.mock.calls[0][1].body);
  const second = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(first.requestId).toMatch(/^[a-f0-9-]{36}$/);
  expect(second.requestId).toBe(first.requestId);
  expect(first.status).toBe('draft');
  expect(second.status).toBe('draft');
  await waitFor(() => expect(state.push).toHaveBeenCalledWith('/social-media'));
});
