import { render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AIChat from '@/components/studio/AIChat';
beforeEach(() => { Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() }); });
afterEach(() => vi.unstubAllGlobals());
it('offers only the owned provider and does not use vendor credentials as readiness', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hasOpenAI: true, aiConfigured: true, hasElevate: false, ownedModel: { verified: false } }) }));
  render(<AIChat />);
  expect(within(screen.getByRole('combobox', { name: 'AI provider' })).getAllByRole('option').map(o => o.textContent)).toEqual(['Elevate-owned AI']);
  expect(await screen.findByText('owned engine unavailable')).toBeVisible();
  expect(screen.queryByText(/OpenAI.*ready/)).toBeNull();
});
it('shows readiness only after a verified owned-model probe', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hasElevate: true, ownedModel: { verified: true } }) }));
  render(<AIChat />);
  await waitFor(() => expect(screen.getByText('Elevate-owned AI ready')).toBeVisible());
});
