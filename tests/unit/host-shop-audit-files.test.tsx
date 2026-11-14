import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import HostShopPacketLinks from '@/components/host-shop/HostShopPacketLinks';
import HostShopDocumentsClient from '@/apps/lms/app/host-shop/dashboard/documents/HostShopDocumentsClient';
import { hostShopPortfolioPhotos } from '@/lib/partners/curated-shop-media';

afterEach(cleanup);

it('offers all assigned packets once, including legacy occupation names', () => {
  render(<HostShopPacketLinks primary="cosmetology" programs={['cosmetology-apprenticeship', 'nail', 'barber', 'esthetician-apprenticeship']} />);
  expect(screen.getAllByRole('link')).toHaveLength(5);
  expect(screen.getByRole('link', { name: /Nail technology/ }).getAttribute('href')).toMatch(/Nail-Technician-Apprenticeship-Syllabus.pdf$/);
});

it('keeps earlier files and supplemental agreements without changing the current requirement', () => {
  const latest = { id: 'current', file_name: 'new.pdf', status: 'accepted' };
  render(<HostShopDocumentsClient partnerId="a" programType="barber" partnerState="IN"
    requirements={[{ document_type: 'barbershop_license', document_name: 'Establishment license', is_required: true, status: 'expired', document: latest }]}
    uploads={[latest, { id: 'mou', file_name: 'Signed MOU.pdf' }, { id: 'prior', file_name: 'earlier.pdf' }]} />);
  expect(screen.getByText('expired')).toBeTruthy();
  expect(screen.getByRole('link', {name:'View file'}).getAttribute('href')).toBe('/api/host-shop/documents/current/download?open=1');
  expect(screen.getByText('Signed MOU.pdf').getAttribute('href')).toBe('/api/host-shop/documents/mou/download?open=1');
  expect(screen.getByText('earlier.pdf')).toBeTruthy();
});

it('uses verified local portfolio copies and omits videos and unsafe image URLs', () => {
  const photos = hostShopPortfolioPhotos('paola-petit', [
    { url: 'https://bucket.setmore.com/files/img/fp0P2PShLRhm/4a14954f-69d2-4990-ac2e-9f0300d29a1f.jpeg' },
    { url: 'javascript:alert(1)' }, { url: '/video.mp4' }, { kind: 'video', url: '/movie' },
  ]);
  expect(photos.map(p => p.url)).toEqual(['/images/partners/paola-petit/official-portfolio-2-2026.webp']);
});
