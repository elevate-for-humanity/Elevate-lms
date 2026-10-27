import { NextResponse } from 'next/server';

// Public network install identity; existing marketing worker and authenticated community own the runtime.
export function GET() {
  return NextResponse.json({
    id: '/pwa/community',
    name: 'Elevate Community',
    short_name: 'Community',
    start_url: '/community',
    scope: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {src:'/images/logo.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/images/logo.png',sizes:'512x512',type:'image/png',purpose:'any'}
    ]
  },{headers:{'Cache-Control':'public, max-age=300'}});
}
