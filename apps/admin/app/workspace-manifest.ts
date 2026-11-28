import { NextResponse } from 'next/server';
import { ADMIN_WORKSPACE_PWAS } from '@/lib/pwa/registry';

const icons = {
  'dev-studio': ['/install/dev-studio-192.png', '/install/dev-studio-512.png'],
  'course-builder': ['/install/course-builder-192.png', '/install/course-builder-512.png'],
  'email': ['/install/email-192.png', '/install/email-512.png'],
} as const;

// Each workspace app installs as itself (PWA audit 2026-11-28, RC-2): the
// manifest identity is the real application — its own id, a start_url at the
// app, and a scope that covers the app — never the static offline draft pad
// under /install/. The draft pads only draft; the in-app install routes
// (installPath) pair these manifests with a covering worker.
const identities = {
  'dev-studio': { id: 'org.elevateforhumanity.dev-studio' },
  'course-builder': { id: 'org.elevateforhumanity.course-builder' },
  'email': { id: 'org.elevateforhumanity.mail' },
} as const;

export function workspaceManifest(key: keyof typeof ADMIN_WORKSPACE_PWAS) {
  const app = ADMIN_WORKSPACE_PWAS[key];
  return NextResponse.json({
    id: identities[key].id,
    name: `Elevate ${app.name}`,
    short_name: app.name,
    start_url: app.openPath,
    scope: `${app.openPath}/`,
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
