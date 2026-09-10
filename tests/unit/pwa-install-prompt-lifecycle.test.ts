import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const registration = readFileSync(
  resolve('components/pwa/CanonicalPwaRegistration.tsx'),
  'utf8',
);
const hook = readFileSync(resolve('hooks/usePwaInstall.ts'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve('public/manifest-admin.json'), 'utf8'));

describe('canonical PWA install prompt lifecycle', () => {
  it('captures the browser prompt at the application root', () => {
    expect(registration).toContain("window.addEventListener('beforeinstallprompt', capturePwaInstallPrompt)");
    expect(registration).toContain("window.removeEventListener('beforeinstallprompt', capturePwaInstallPrompt)");
  });

  it('replays a previously captured prompt to install controls mounted after navigation', () => {
    expect(hook).toContain('subscribeToPwaInstallPrompt(setPromptEvent)');
    expect(hook).not.toContain("window.addEventListener('beforeinstallprompt'");
  });

  it('opens the installed Admin PWA on the dashboard', () => {
    expect(manifest.start_url).toBe('/dashboard');
  });
});
