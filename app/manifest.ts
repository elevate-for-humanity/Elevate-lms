import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Elevate for Humanity',
    short_name: 'Elevate',
    description: 'Free career training in healthcare, skilled trades, and business',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#f97316',
    categories: ['education', 'business'],
    icons: [
      { src: '/icon-72.png',  sizes: '72x72',   type: 'image/png', purpose: 'any' },
      { src: '/icon-96.png',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
      { src: '/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
      { src: '/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      // 192 and 512 serve both any + maskable
      { src: '/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Chrome 119+ requires screenshots to show the install prompt
    screenshots: [
      {
        src: '/screenshots/home-narrow.jpg',
        sizes: '1080x1920',
        // @ts-expect-error — form_factor is valid per spec, not yet in Next.js types
        form_factor: 'narrow',
        type: 'image/jpeg',
        label: 'Elevate for Humanity — career training programs',
      },
      {
        src: '/screenshots/home-wide.jpg',
        sizes: '1920x1080',
        // @ts-expect-error — form_factor is valid per spec, not yet in Next.js types
        form_factor: 'wide',
        type: 'image/jpeg',
        label: 'Elevate for Humanity — employer partners and job placement',
      },
    ],
  };
}
