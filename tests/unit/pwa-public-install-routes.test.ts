import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const middleware = readFileSync('apps/admin/middleware.ts', 'utf8');
const rootLayout = readFileSync('apps/admin/app/layout.tsx', 'utf8');
const loginForm = readFileSync('apps/admin/app/login/LoginForm.tsx', 'utf8');

function publicInstallEntries(source: string): string[] {
  const block = source.match(/const PUBLIC_INSTALL_PATHS = new Set\(\[([\s\S]*?)\]\);/);
  expect(block, 'middleware declares PUBLIC_INSTALL_PATHS').not.toBeNull();
  return [...block![1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

describe('public PWA install routes (owner order 2026-11-28)', () => {
  it('exempts exactly the four install routes from the auth gate — the apps themselves stay gated', () => {
    expect(publicInstallEntries(middleware)).toEqual([
      '/phone/install',
      '/mail/install',
      '/studio/install',
      '/studio/courses/install',
    ]);
    // Exact-match membership only: no prefix rule may leak the gated apps
    // (/phone, /mail, /studio) or their subtrees into the public set.
    expect(middleware).toContain('PUBLIC_INSTALL_PATHS.has(pathname)');
  });

  it('marks the public mail install route as the mail app so the root layout registers the mail worker signed out', () => {
    expect(middleware).toContain("pathname === '/mail/install'");
    expect(middleware).toContain("requestHeaders.set('x-elevate-mail-app', '1')");
    // The layout side of the pairing: the mail register mounts only on the mark.
    expect(rootLayout).toContain('mailApp ? <MailPwaRegister /> : <AdminPwaRegister />');
  });

  it('keeps each public install route paired with its own manifest and the prompt-capture button', () => {
    const phoneLayout = readFileSync('apps/admin/app/phone/layout.tsx', 'utf8');
    expect(phoneLayout).toContain("manifest: '/manifest-phone.json'");
    expect(phoneLayout).toContain('PhonePwaRegistration');
    expect(readFileSync('apps/admin/app/phone/install/page.tsx', 'utf8')).toContain('PwaInstallButton');

    const mailLayout = readFileSync('apps/admin/app/mail/layout.tsx', 'utf8');
    expect(mailLayout).toContain("manifest: '/manifest-mail.json'");
    expect(readFileSync('apps/admin/app/mail/install/page.tsx', 'utf8')).toContain('PwaInstallButton');

    const studioInstall = readFileSync('apps/admin/app/studio/install/page.tsx', 'utf8');
    expect(studioInstall).toContain("manifest: '/manifest-dev-studio.json'");
    expect(studioInstall).toContain('PwaInstallButton');

    const coursesInstall = readFileSync('apps/admin/app/studio/courses/install/page.tsx', 'utf8');
    expect(coursesInstall).toContain("manifest: '/manifest-course-builder.json'");
    expect(coursesInstall).toContain('PwaInstallButton');
  });

  it('never leaves the admin Sign In button disabled waiting on hydration', () => {
    expect(loginForm).not.toContain('hydrated');
    expect(loginForm).not.toContain('!hydrated');
    expect(loginForm).toContain('disabled={loading}');
  });
});
