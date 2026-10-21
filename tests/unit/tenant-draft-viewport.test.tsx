import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { TenantDraftViewport } from '@/components/website-builder/TenantDraftViewport';

afterEach(cleanup);

it('renders the unsaved draft and its active controls inside the selected viewport', async () => {
  const action = vi.fn();
  render(<TenantDraftViewport width={390} title="Customer mobile draft"><button onClick={action}>Draft control</button></TenantDraftViewport>);
  const frame = screen.getByTitle('Customer mobile draft') as HTMLIFrameElement;
  expect(frame.style.width).toBe('390px');
  expect(frame.style.maxWidth).toBe('none');
  // Hydration may start after the iframe's load event has already happened.
  await waitFor(() => expect(within(frame.contentDocument!.body).getByRole('button', { name: 'Draft control' })).toBeTruthy());
  fireEvent.click(within(frame.contentDocument!.body).getByRole('button', { name: 'Draft control' }));
  expect(action).toHaveBeenCalledOnce();
});
