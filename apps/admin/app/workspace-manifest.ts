import { NextResponse } from 'next/server';
import { ADMIN_WORKSPACE_PWAS } from '@/lib/pwa/registry';

const icons = {
  'dev-studio': ['/install/dev-studio-192.png', '/install/dev-studio-512.png'],
  'course-builder': ['/install/course-builder-192.png', '/install/course-builder-512.png'],
  'email': ['/install/email-192.png', '/install/email-512.png'],
} as const;

export function workspaceManifest(key: keyof typeof ADMIN_WORKSPACE_PWAS) {
  const app = ADMIN_WORKSPACE_PWAS[key];
  return NextResponse.json({
    id: `/pwa/${key}`,
    name: `Elevate ${app.name}`,
    short_name: app.name,
    start_url: app.installPath,
    scope: app.installPath,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#153052',
    icons: icons[key].map((src, index) => ({
      src,
      sizes: index === 0 ? '192x192' : '512x512',
      type: 'image/png',
      purpose: 'any',
    })),
  }, { headers: { 'Cache-Control': 'public, max-age=300', 'Content-Type': 'application/manifest+json' } });
}
