import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { existsSync } from 'node:fs';
import { shopGalleryForProgram, shopVideoForProgram, curateShopGallery } from '@/lib/partners/curated-shop-media';
import { REVIEWED_HOST_SHOP_MEDIA } from '@/lib/partners/reviewed-shop-program-media';

const fixtures = vi.hoisted(() => ({
  approved: { id: 'dbo', publicSlug: 'dbo-hair-studios-cddf6115', name: 'DBO Hair Studios', address: '2626 W Washington St, Indianapolis, IN 46222', city: 'Indianapolis', state: 'IN', zip: '46222', programs: ['cosmetology-apprenticeship'], videoUrl: '/uploaded-dbo.mp4' },
  profile: { public_slug: 'dbo-hair-studios-cddf6115', media_gallery: [{ url: '/profile-only.webp', alt: 'Saved profile photograph' }], video_url: '/old-profile-tour.mp4' } as { public_slug: string; media_gallery: {url: string; alt: string}[]; video_url: string } | null,
}));
vi.mock('@/lib/programs/host-shop-network', () => ({ getHostShopNetwork: async () => [{ ...fixtures.approved, slug: fixtures.approved.publicSlug, description: 'DBO approved portfolio', gallery: [{ url: '/images/host-shops/dbo-hair-studios/evelyn.webp', alt: 'Network portrait' }], videoUrl: '/network-dbo.mp4' }] }));
vi.mock('@/lib/programs/host-shops', () => ({ getApprovedShopByPublicSlug: async () => fixtures.approved }));
vi.mock('@/lib/partners/public-host-shops', () => ({ getPublicHostShopBySlug: async () => fixtures.profile }));
vi.mock('@/components/partners/HostShopMediaCarousel', () => ({ default: ({items, videoUrl, videoScript}: {videoScript?: string; items: {url: string; alt?: string}[]; videoUrl?: string}) => <div data-video-script={videoScript}>{items.map(item => <img key={item.url} src={item.url} alt={item.alt} />)}{videoUrl && <video aria-label="Shop video" src={videoUrl} />}</div> }));
import HostShopPageNavigation from '@/components/partners/HostShopPageNavigation';
import HostShopProfilePage, { generateMetadata } from '@/apps/marketing/app/host-shops/[slug]/page';
afterEach(cleanup);
beforeEach(() => { fixtures.profile = { public_slug: 'dbo-hair-studios-cddf6115', media_gallery: [{url: '/profile-only.webp', alt: 'Saved profile photograph'}], video_url: '/old-profile-tour.mp4' }; });

it('publishes navigation only for approved shops, including when saved onboarding profiles exist', async () => {
  render(await HostShopPageNavigation());
  expect(screen.getByText('Choose a shop (1)')).toBeInTheDocument();
  expect(screen.getByRole('link', {name: 'DBO Hair Studios'})).toHaveAttribute('href', '/host-shops/dbo-hair-studios-cddf6115');
  expect(screen.queryByRole('link', {name: /MARVELOUZ|Barbershop 32/i})).not.toBeInTheDocument();
});
it('retains assembled network photographs and video when a public profile already exists', async () => {
  render(await HostShopProfilePage({ params: Promise.resolve({slug: fixtures.approved.publicSlug}) }));
  expect(screen.getByAltText('Network portrait')).toBeInTheDocument();
  expect(screen.getByAltText('Saved profile photograph')).toBeInTheDocument();
  expect(screen.getByLabelText('Shop video')).toHaveAttribute('src', '/network-dbo.mp4');
  expect(document.querySelector('[data-scroll-narration]')).toBeNull();
  expect(document.querySelector('[data-video-script]')).toBeNull();
  const metadata = await generateMetadata({params: Promise.resolve({slug: fixtures.approved.publicSlug})});
  expect(metadata.openGraph?.images).toEqual([{url: '/images/host-shops/dbo-hair-studios/evelyn.webp', alt: 'DBO Hair Studios Host Site'}]);
});
it('preserves network media when no optional public profile exists', async () => {
  fixtures.profile = null;
  render(await HostShopProfilePage({params: Promise.resolve({slug: fixtures.approved.publicSlug})}));
  expect(screen.getByAltText('Network portrait')).toBeInTheDocument();
  expect(screen.getByLabelText('Shop video')).toHaveAttribute('src', '/network-dbo.mp4');
});

describe('reviewed shop and program media boundaries', () => {
  const cal = '/images/partners/cals-kutz/client-cut-enhanced-2026.webp';
  it('rejects unlabeled salon photography and barber cuts on the opposite trade', () => {
    expect(shopGalleryForProgram('cals-kutz-studio', [{url: '/portfolio/hair-color.jpg'}, {url: '/photo-123.jpg'}], 'barber-apprenticeship')).toEqual([]);
    expect(shopGalleryForProgram('cals-kutz-studio', [{url: cal}], 'cosmetology-apprenticeship')).toEqual([]);
    expect(shopGalleryForProgram('cals-kutz-studio', [{url: cal}], 'barber-apprenticeship')).toHaveLength(1);
  });
  it('requires shop ownership as well as the reviewed occupation', () => {
    expect(shopGalleryForProgram('executivecutz', [{url: cal}], 'barber-apprenticeship')).toEqual([]);
    expect(shopGalleryForProgram('cals-kutz-studio-cb30517f', [{url: cal}], 'barber-apprenticeship')).toHaveLength(1);
    expect(shopGalleryForProgram('cals-kutz-studio', [{url: 'https://unrelated.example'+cal}], 'barber-apprenticeship')).toEqual([]);
  });
  it('preserves unknown uploads in the general portfolio', () => {
    expect(curateShopGallery('cals-kutz-studio', [{url: '/photo-123.jpg'}])).toEqual([{url: '/photo-123.jpg'}]);
  });
  it('keeps tours on their own reviewed shop and trade', () => {
    const tour = '/videos/partners/kountry-kutz-tour.mp4';
    expect(shopVideoForProgram('kountry-kutz-barbershop', tour, 'barber-apprenticeship')).toBe(tour);
    expect(shopVideoForProgram('kountry-kutz-barbershop', tour, 'cosmetology-apprenticeship')).toBeUndefined();
    expect(shopVideoForProgram('executivecutz', tour, 'barber-apprenticeship')).toBeUndefined();
  });
  it('references only files shipped in the repository', () => {
    for (const entry of REVIEWED_HOST_SHOP_MEDIA) for (const asset of entry.assets) expect(existsSync(`public${asset}`), asset).toBe(true);
  });
});
