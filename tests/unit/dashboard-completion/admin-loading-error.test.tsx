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
it('delegates caught chunks to the existing recovery owner without installing a second handler', () => {
  const receive = vi.fn((event: Event) => event.preventDefault());
  window.addEventListener('elevate:chunk-error', receive);
  const install = vi.spyOn(window, 'addEventListener');
  try {
    render(
      <AdminErrorBoundary error={new Error('ChunkLoadError loading chunk 4321')} reset={vi.fn()} />,
    );
    expect(receive).toHaveBeenCalledTimes(1);
    expect((receive.mock.calls[0][0] as CustomEvent).detail).toContain('ChunkLoadError');
    expect(install.mock.calls.filter(([type]) => type === 'elevate:chunk-error')).toHaveLength(0);
  } finally {
    install.mockRestore();
    window.removeEventListener('elevate:chunk-error', receive);
  }
});
it('does not dispatch automatic recovery for a server record-loading failure', () => {
  const receive = vi.fn();
  window.addEventListener('elevate:chunk-error', receive);
  try {
    render(<AdminErrorBoundary error={new Error('record query failed')} reset={vi.fn()} />);
    expect(receive).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener('elevate:chunk-error', receive);
  }
});
it('installs and cleans up the same recovery handler when the root head script is missing', () => {
  const blocked = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const install = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  try {
    const view = render(
      <AdminErrorBoundary error={new Error('ChunkLoadError loading chunk 987')} reset={vi.fn()} />,
    );
    expect(install.mock.calls.filter(([type]) => type === 'elevate:chunk-error')).toHaveLength(1);
    view.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'elevate:chunk-error')).toHaveLength(1);
  } finally {
    blocked.mockRestore();
    install.mockRestore();
    remove.mockRestore();
  }
});
