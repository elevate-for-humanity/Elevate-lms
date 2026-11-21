import { NextResponse } from 'next/server';
import { ADMIN_WORKSPACE_PWAS } from './registry';

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
    icons: [192, 512].map((size) => ({
      src: `/install/${key}-${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
  }, { headers: { 'Cache-Control': 'public, max-age=300', 'Content-Type': 'application/manifest+json' } });
}
