import { NextResponse } from 'next/server';

// Reuse the existing Admin service worker; each PWA has a stable unique identity.
export function GET() {
  return NextResponse.json({
    id: '/pwa/dev-studio',
    name: 'Elevate Dev Studio',
    short_name: 'Dev Studio',
    description: 'Secure Elevate for Humanity workspace',
    start_url: '/studio',
    scope: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
