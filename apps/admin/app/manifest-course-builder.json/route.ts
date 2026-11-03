import { NextResponse } from 'next/server';

// Reuse the existing Admin service worker; each PWA has a stable unique identity.
export function GET() {
  return NextResponse.json({
    id: '/pwa/course-builder',
    name: 'Elevate Course Builder',
    short_name: 'Course Builder',
    description: 'Secure Elevate for Humanity workspace',
    start_url: '/install/course-builder.html',
    scope: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
