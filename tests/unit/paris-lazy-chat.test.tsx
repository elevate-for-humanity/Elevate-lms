import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ chatImports: 0 }));
vi.mock('next/navigation', () => ({ usePathname: () => '/program-holder/dashboard' }));
vi.mock('@/components/paris/ParisChat', () => {
  state.chatImports += 1;
  return { default: ({ personName }: { personName?: string }) => <p>Chat ready for {personName}</p> };
});
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';

it('loads the chat only when opened, keeps the portal identity and closes with Escape', async () => {
  render(<ParisFloatingButton surface="portal" personName="Taylor" />);
  expect(state.chatImports).toBe(0);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Open PARIS Portal Assistant' }));
  expect(await screen.findByText('Chat ready for Taylor')).toBeTruthy();
  expect(state.chatImports).toBe(1);
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});
