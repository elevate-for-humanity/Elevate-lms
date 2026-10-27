import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LizzyContainer } from '@/components/admin/dashboard/LizzyContainer';

vi.mock('@/components/admin/dashboard/LizzyWorkspace', () => ({
  LizzyWorkspace: ({ onPreviewUrlDetected }: { onPreviewUrlDetected?: (url: string) => void }) =>
    <button onClick={() => onPreviewUrlDetected?.('https://www.elevateforhumanity.org/programs/bookkeeping')}>Preview completed change</button>,
}));
vi.mock('@/components/admin/dashboard/LivePreviewIframe', () => ({
  LivePreviewIframe: ({ url }: { url: string }) => <div data-testid="live-preview">{url}</div>,
}));
vi.mock('@/components/admin/dashboard/SiteHealthStrip', () => ({ SiteHealthStrip: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('opens the URL returned by the command workspace in the live preview', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));
  render(<LizzyContainer sites={[{ label:'Public site', url:'https://www.elevateforhumanity.org' }]} />);
  fireEvent.click(screen.getByRole('button', { name:'Preview completed change' }));
  await waitFor(() => expect(screen.getByRole('textbox', { name:'Preview URL' })).toHaveValue('https://www.elevateforhumanity.org/programs/bookkeeping'));
});
