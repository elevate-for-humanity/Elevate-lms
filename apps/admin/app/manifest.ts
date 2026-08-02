import { MetadataRoute } from 'next';

const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'org.elevateforhumanity.admin',
    name: 'Elevate Admin',
    short_name: 'EFH Admin',
    description: 'Administrative dashboard for managing programs, students, and operations',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#f97316',
    categories: ['business', 'productivity'],
    icons: [
      { src: `${CDN}/icons/admin-72.png`, sizes: '72x72', type: 'image/png', purpose: 'any' },
      { src: `${CDN}/icons/admin-96.png`, sizes: '96x96', type: 'image/png', purpose: 'any' },
      { src: `${CDN}/icons/admin-128.png`, sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: `${CDN}/icons/admin-144.png`, sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: `${CDN}/icons/admin-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${CDN}/icons/admin-192-maskable.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: `${CDN}/icons/admin-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${CDN}/icons/admin-512-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      {
        src: `${CDN}/screenshots/home-wide.jpg`,
        sizes: '1920x1080',
        type: 'image/jpeg',
        label: 'Dashboard view',
        // @ts-expect-error — form_factor is valid per spec, not yet in Next.js types
        form_factor: 'wide',
      },
      {
        src: `${CDN}/screenshots/home-narrow.jpg`,
        sizes: '1080x1920',
        type: 'image/jpeg',
        label: 'Home screen',
        // @ts-expect-error — form_factor is valid per spec, not yet in Next.js types
        form_factor: 'narrow',
      },
    ],
    shortcuts: [
      {
        name: 'Students',
        short_name: 'Students',
        url: '/students',
        icons: [{ src: `${CDN}/icons/admin-96.png`, sizes: '96x96' }],
      },
      {
        name: 'Applications',
        short_name: 'Apps',
        url: '/applications',
        icons: [{ src: `${CDN}/icons/admin-96.png`, sizes: '96x96' }],
      },
      {
        name: 'Reports',
        short_name: 'Reports',
        url: '/reports',
        icons: [{ src: `${CDN}/icons/admin-96.png`, sizes: '96x96' }],
      },
    ],
  };
}
