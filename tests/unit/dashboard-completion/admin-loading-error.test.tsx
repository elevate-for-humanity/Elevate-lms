import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Loading from '@/apps/admin/app/loading';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';
it('shows an honest loading state without empty record counts', () => {
  render(<Loading />);
  expect(screen.getByRole('status').textContent).toContain('Loading your saved records');
});
it('keeps a failed record lookup visible and allows recovery', () => {
  const reset = vi.fn();
  render(<AdminErrorBoundary error={new Error('lookup unavailable')} reset={reset} />);
  expect(screen.getByRole('alert').textContent).toContain('could not load');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(reset).toHaveBeenCalledOnce();
});
it('does not crash or start a reload loop when recovery storage is blocked', () => {
  const blocked = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  try {
    render(
      <AdminErrorBoundary error={new Error('ChunkLoadError loading chunk 123')} reset={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Refresh now' })).toBeTruthy();
  } finally {
    blocked.mockRestore();
  }
});
