import { MetadataRoute } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Elevate Admin',
    short_name: 'EFH Admin',
    description: 'Elevate for Humanity — Admin Portal',
    start_url: '/admin/dashboard',
    scope: '/admin',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/admin-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icons/admin-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icons/admin-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/admin-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/admin-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/admin-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      {
        src: '/screenshots/home-wide.jpg',
        sizes: '1920x1080',
        form_factor: 'wide',
        type: 'image/jpeg',
        label: 'Elevate Admin — dashboard overview',
      },
      {
        src: '/screenshots/home-narrow.jpg',
        sizes: '1080x1920',
        // @ts-expect-error — form_factor is valid per spec, not yet in Next.js types
        form_factor: 'narrow',
        type: 'image/jpeg',
        label: 'Elevate Admin — mobile view',
      },
    ],
  };
}
