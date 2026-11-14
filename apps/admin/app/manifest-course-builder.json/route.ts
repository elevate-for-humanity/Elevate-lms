import { NextResponse } from 'next/server';

// Reuse the existing Admin service worker; each PWA has a stable unique identity.
export function GET() {
  return NextResponse.json({
    id: '/pwa/course-builder',
    name: 'Elevate Course Builder',
    short_name: 'Course Builder',
    description: 'Secure Elevate for Humanity workspace',
    start_url: '/studio/courses',
    shortcuts: [{"name":"Phone & ringer","short_name":"Phone & ringer","description":"Open the dial pad and incoming call alert controls.","url":"/phone/dial-pad#incoming-call-alert-mode","icons":[{"src":"/icon-96.png","sizes":"96x96","type":"image/png"}]},{"name":"Text messages","short_name":"Texts","url":"/phone/texts","icons":[{"src":"/icon-96.png","sizes":"96x96","type":"image/png"}]},{"name":"Interoffice email","short_name":"Email","url":"/phone/email","icons":[{"src":"/icon-96.png","sizes":"96x96","type":"image/png"}]}],
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
