import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import BarberWorkforceNetworkMap from '@/components/programs/beauty/BarberWorkforceNetworkMap';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('loads current approved barber shops for every legacy no-prop map caller', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ shops: [
    { id: 'barber', publicSlug: 'approved-barber', name: 'Approved Barber', address: '1 Main Street', city: 'Indy', state: 'IN', programs: ['barber-apprenticeship'] },
    { id: 'salon', publicSlug: 'salon-only', name: 'Salon Only', address: '2 Main Street', city: 'Indy', state: 'IN', programs: ['cosmetology-apprenticeship'] },
  ] }) });
  vi.stubGlobal('fetch', fetcher);
  render(<BarberWorkforceNetworkMap />);
  expect(await screen.findByText('Approved Barber')).toBeInTheDocument();
  expect(screen.queryByText('Salon Only')).not.toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith('/api/programs/host-shops?program=barber', expect.objectContaining({ signal: expect.any(AbortSignal) }));
});

it('does not replace an explicitly empty approved list with static promotional shops', () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  render(<BarberWorkforceNetworkMap shops={[]} />);
  expect(fetcher).not.toHaveBeenCalled();
  expect(screen.queryByText(/Kountry Kutz/)).not.toBeInTheDocument();
});

it('reports an unavailable approval source while retaining community support', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  render(<BarberWorkforceNetworkMap />);
  expect(await screen.findByRole('status')).toHaveTextContent('Host Shop locations are temporarily unavailable');
  expect(screen.getByRole('heading', { name: 'Barber Host Shop map and community support' })).toBeInTheDocument();
});
