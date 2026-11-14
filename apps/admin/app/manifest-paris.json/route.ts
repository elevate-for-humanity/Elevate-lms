import { NextResponse } from 'next/server';

// Reuse the existing Admin service worker; each PWA has a stable unique identity.
export function GET() {
  return NextResponse.json({
    id: '/pwa/paris',
    name: 'PARIS — Elevate AI',
    short_name: 'PARIS',
    description: 'Secure Elevate for Humanity workspace',
    start_url: '/paris',
    shortcuts: [{"name":"Phone & ringer","short_name":"Phone & ringer","description":"Open the dial pad and incoming call alert controls.","url":"/phone/dial-pad#incoming-call-alert-mode","icons":[{"src":"/icon-96.png","sizes":"96x96","type":"image/png"}]},{"name":"Text messages","short_name":"Texts","url":"/phone/texts","icons":[{"src":"/icon-96.png","sizes":"96x96","type":"image/png"}]},{"name":"Interoffice email","short_name":"Email","url":"/phone/email","icons":[{"src":"/icon-96.png","sizes":"96x96","type":"image/png"}]}],
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
