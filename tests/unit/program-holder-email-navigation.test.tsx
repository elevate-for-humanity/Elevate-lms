import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('keeps holder communication links inside the holder workspace while preview stays read-only', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ readOnly: true, isAdmin: false, mailboxes: [{ id: 'mail', address: 'holder@example.test', displayName: 'Holder', mailboxKind: 'program_holder', accessLevel: 'read' }], selectedMailboxId: 'mail', filters: [], folders: [], drafts: [], threads: [] }) })));
  render(<EmailWorkspace communicationLinks={{ phone: '/program-holder/phone', chat: '/program-holder/inbox', calendar: '/program-holder/meetings' }} />);
  const nav = await screen.findByRole('navigation', { name: 'Communication tools' });
  expect(within(nav).getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', '/program-holder/meetings');
  expect(within(nav).getByRole('link', { name: 'Chat' })).toHaveAttribute('href', '/program-holder/inbox');
  expect(within(nav).getByRole('link', { name: 'Phone inbox' })).toHaveAttribute('href', '/program-holder/phone');
  expect(screen.queryByRole('button', { name: /Compose/ })).not.toBeInTheDocument();
});
