import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const registry = readFileSync('lib/pwa/registry.ts', 'utf8');
const registration = readFileSync('components/pwa/CanonicalPwaRegistration.tsx', 'utf8');
const mailRegister = readFileSync('components/pwa/MailPwaRegister.tsx', 'utf8');
const mailWorker = readFileSync('public/sw-mail.js', 'utf8');
const mailManifest = JSON.parse(readFileSync('public/manifest-mail.json', 'utf8'));
const mailLayout = readFileSync('apps/admin/app/mail/layout.tsx', 'utf8');
const mailPage = readFileSync('apps/admin/app/mail/page.tsx', 'utf8');
const mailAccountsPage = readFileSync('apps/admin/app/mail/accounts/page.tsx', 'utf8');
const rootLayout = readFileSync('apps/admin/app/layout.tsx', 'utf8');
const chrome = readFileSync('components/admin/AdminApplicationChrome.tsx', 'utf8');
const middleware = readFileSync('apps/admin/middleware.ts', 'utf8');
const nextConfig = readFileSync('apps/admin/next.config.mjs', 'utf8');
const syncPwaPublic = readFileSync('scripts/sync-pwa-public.mjs', 'utf8');
const packagingContract = readFileSync('scripts/verify-pwa-packaging-contract.mjs', 'utf8');
const stampSw = readFileSync('scripts/stamp-sw.mjs', 'utf8');
const installPage = readFileSync('apps/admin/public/install/email.html', 'utf8');

describe('Elevate Mail PWA contract', () => {
  it('registers mail as a canonical application with its own worker, caches, manifest, and scope', () => {
    expect(registry).toContain(
      "mail: { workerPath: '/sw-mail.js', cachePrefix: 'elevate-mail-', manifestPath: '/manifest-mail.json', scope: '/mail/' }",
    );
    expect(registry).toContain("scope: '/'");
    expect(mailRegister).toContain('<CanonicalPwaRegistration application="mail" />');
  });

  it('gives the installed app an identity that opens straight to the inbox', () => {
    expect(mailManifest.name).toBe('Elevate Mail');
    expect(mailManifest.short_name).toBe('Mail');
    expect(mailManifest.id).toBe('org.elevateforhumanity.mail');
    expect(mailManifest.start_url).toBe('/mail');
    expect(mailManifest.scope).toBe('/mail/');
    expect(mailManifest.display).toBe('standalone');
    const iconSources = mailManifest.icons.map((icon: { src: string }) => icon.src);
    expect(iconSources).toContain('/install/email-192.png');
    expect(iconSources).toContain('/install/email-512.png');
  });

  it('keeps the mail worker from ever caching authenticated pages or API data', () => {
    expect(mailWorker).toContain('__CACHE_VERSION__');
    expect(mailWorker).toContain("if (request.mode === 'navigate') return;");
    expect(mailWorker).toContain("url.pathname.startsWith('/api/')");
    expect(mailWorker).toContain("name.startsWith('elevate-mail-')");
    expect(mailWorker).not.toContain('incoming_call');
  });

  it('protects sibling applications sharing the Admin origin', () => {
    expect(registration).toContain('scope: config.scope');
    expect(registration).toContain('knownWorkerPaths');
    expect(registration).toContain('knownCachePrefixes');
    expect(registration).toContain(
      'purgeBrokenPwaState(config.workerPath, config.cachePrefix)',
    );
  });

  it('renders the inbox bare: mail identity, no Admin chrome, no phone receiver', () => {
    expect(mailLayout).toContain("manifest: '/manifest-mail.json'");
    expect(mailLayout).toContain("applicationName: 'Elevate Mail'");
    expect(chrome).toContain("pathname === '/mail' || pathname.startsWith('/mail/')");
    expect(chrome).toContain('data-elevate-mail-shell');
    expect(rootLayout).toContain('mailApp ? <MailPwaRegister /> : <AdminPwaRegister />');
    expect(rootLayout).toContain('mailApp ? null :');
    expect(rootLayout).toContain('<AutomaticPhone admin />');
  });

  it('reuses the existing inbox and its authorization model', () => {
    expect(mailPage).toContain("from '@/components/communications/EmailWorkspace'");
    expect(mailPage).toContain('requireRole(COMMUNICATION_MEMBER_ROLES)');
    expect(mailPage).toContain('communicationLinks={null}');
    expect(mailPage).toContain('initialMailboxId={params.mailboxId}');
    expect(mailPage).toContain('initialThreadId={params.threadId}');
    expect(mailAccountsPage).toContain("from '../../phone/email/accounts/page'");
    expect(middleware).toContain("pathname === '/mail'");
    expect(middleware).toContain("pathname.startsWith('/mail/')");
  });

  it('ships the worker and manifest through the canonical packaging path', () => {
    expect(syncPwaPublic).toContain("'sw-mail.js', 'manifest-mail.json'");
    expect(syncPwaPublic).toContain(
      "extraWorkers: [{ file: 'sw-mail.js', cachePrefix: 'elevate-mail-' }]",
    );
    expect(packagingContract).toContain("'sw-mail.js', 'manifest-mail.json'");
    expect(stampSw).toContain("path: 'public/sw-mail.js'");
    expect(stampSw).toContain("path: 'apps/admin/public/sw-mail.js'");
    expect(nextConfig).toContain("source: '/sw-mail.js'");
    expect(nextConfig).toContain("source: '/manifest-mail.json'");
  });

  it('points every email install surface at the real app, inside its own scope', () => {
    expect(registry).toContain("email: { name: 'Email', openPath: '/mail', installPath: '/mail/install' }");
    // Standing rule (Elizabeth, 2026-11-26): every install surface points at
    // the real app. Corrected design (PWA audit 2026-11-28, RC-1): the
    // install surface is a route inside the /mail/ scope, where the mail
    // layout links the mail manifest and the root layout registers the mail
    // worker, so beforeinstallprompt can actually fire. The retired static
    // page sat outside the scope and could never offer an install; it now
    // only redirects into the app.
    const installRoute = readFileSync('apps/admin/app/mail/install/page.tsx', 'utf8');
    expect(installRoute).toContain('PwaInstallButton');
    expect(installPage).toContain('url=/mail/install');
    expect(installPage).toContain('href="/mail/install"');
    expect(installPage).not.toContain('rel="manifest"');
    expect(installPage).not.toContain('serviceWorker.register');
    expect(installPage).not.toContain('workspace.js');
  });
});
