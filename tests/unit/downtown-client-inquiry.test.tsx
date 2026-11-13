import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DowntownClientInquiry from '@/components/partners/DowntownClientInquiry';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function fill() {
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Client Example' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'client@example.test' } });
  fireEvent.change(screen.getByLabelText('What interests you?'), { target: { value: 'Nail services' } });
  fireEvent.change(screen.getByLabelText('Tell us what you’re looking for'), { target: { value: 'I am interested in downtown nail services.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ask about downtown beauty services' }));
}
it('sends a service inquiry to contact intake rather than student applications', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal('fetch', fetcher);
  render(<DowntownClientInquiry />); fill();
  await screen.findByRole('status');
  const [url, request] = fetcher.mock.calls[0];
  expect(url).toBe('/api/contact');
  expect(JSON.parse(request.body)).toMatchObject({ role: 'beauty-service-client', interest: 'mesmerized-downtown-client' });
  expect(screen.getByRole('status')).toHaveTextContent('This is not an appointment booking');
});
it('preserves entered details and avoids success claims when receipt fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false }) }));
  render(<DowntownClientInquiry />); fill();
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Email')).toHaveValue('client@example.test');
  expect(screen.queryByRole('status')).toBeNull();
  await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
});
