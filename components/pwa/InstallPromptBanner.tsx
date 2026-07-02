'use client';

/**
 * Root-level PWA install prompt.
 * Rendered once in app/layout.tsx — covers all portals (LMS, public, employer, etc).
 * Admin gets its own AdminInstallPrompt in apps/admin/app/admin/layout.tsx.
 *
 * Uses the generic Elevate brand. The underlying InstallPrompt handles:
 *   - already-installed (standalone) detection → renders nothing
 *   - 7-day dismissal cooldown via localStorage
 *   - iOS "Add to Home Screen" instructions
 *   - Android/Chrome native install prompt
 */

import { InstallPrompt } from './InstallPrompt';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function InstallPromptBanner() {
  return (
    <InstallPrompt
      appName={PLATFORM_DEFAULTS.orgName}
      appDescription="Add to your home screen for fast access to your courses and programs."
      themeColor="#1E3A5F"
    />
  );
}

// Default export for next/dynamic
export default InstallPromptBanner;
