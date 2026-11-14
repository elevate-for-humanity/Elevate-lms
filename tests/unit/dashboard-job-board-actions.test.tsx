import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import JobBoardPanel from '@/components/admin/dashboard/JobBoardPanel';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const stats = { count: 12, configured: { usajobs: true, careerOneStop: true }, sources: { USAJobs: { records: 12, latestImport: '2026-10-24T12:00:00Z' } } };
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }
function responses(importResponse: Response, refreshResponse = json(stats)) {
  const fetcher = vi.fn().mockResolvedValueOnce(json(stats)).mockResolvedValueOnce(importResponse).mockResolvedValueOnce(refreshResponse);
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}
async function importJobs() {
  render(<JobBoardPanel />);
  await waitFor(() => expect(screen.queryByText('—')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Run Import' }));
}
it('uses the real feed status contract for counts and provider connection', async () => {
  responses(json({}));
  render(<JobBoardPanel />);
  expect(await screen.findByText('12')).toBeVisible();
  expect(screen.getAllByText('API configured')).toHaveLength(2);
  expect(screen.queryByText('Connected')).toBeNull();
  expect(screen.queryByText('Never')).toBeNull();
});
it('reports an HTTP failure and leaves the import available for retry without claiming success', async () => {
  const fetcher = responses(json({ error: 'Import unavailable' }, 503));
  await importJobs();
  expect(await screen.findByRole('alert')).toHaveTextContent('Import unavailable');
  expect(screen.queryByText(/Imported .* jobs/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Run Import' })).toBeEnabled();
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it('renders the acknowledged import total and displays partial provider failures', async () => {
  responses(json({ ok: true, imported: { total: 3, usaJobs: 3, careerOneStop: 0 }, errors: { careerOneStop: 'Provider unavailable' } }));
  await importJobs();
  expect(await screen.findByRole('status')).toHaveTextContent('Imported 3 jobs.');
  expect(screen.getByRole('alert')).toHaveTextContent('CareerOneStop: Provider unavailable');
});
it('keeps an acknowledged import successful when the separate status refresh fails', async () => {
  responses(json({ ok: true, imported: { total: 3 }, errors: {} }), json({ error: 'Status unavailable' }, 503));
  await importJobs();
  expect(await screen.findByRole('status')).toHaveTextContent('Imported 3 jobs.');
  expect(await screen.findByRole('alert')).toHaveTextContent('Import completed, but status could not refresh');
  expect(screen.getByText('12')).toBeVisible();
});
