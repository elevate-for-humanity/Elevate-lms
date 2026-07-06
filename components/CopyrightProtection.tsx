'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

/**
 * CopyrightProtection
 *
 * Mounts on every public page via app/layout.tsx.
 * - Adds invisible watermark DOM node (data-copyright attribute)
 * - Appends copyright notice to clipboard when >100 chars are copied
 *   (does NOT block the copy — students can still copy content)
 * - Blocks right-click on images only (not text)
 * - Adds noai/noimageai robots meta tags to discourage AI scraping
 *
 * Does NOT fire alerts for DevTools, F12, or right-click on text —
 * those are normal user behaviors and create false positives.
 */
export function CopyrightProtection() {
  useEffect(() => {
    // ── 1. Append copyright notice to clipboard on large copies ──────────────
    // Does not block the copy — just adds attribution.
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() ?? '';
      if (selection.length > 100) {
        const notice = `\n\n— © ${new Date().getFullYear()} ${PLATFORM_DEFAULTS.orgName}. All Rights Reserved. Source: ${window.location.href}`;
        const withNotice = selection + notice;
        try {
          e.clipboardData?.setData('text/plain', withNotice);
          e.preventDefault();
        } catch {
          // Clipboard API unavailable — let the copy proceed unmodified
        }
      }
    };

    // ── 2. Block right-click on images only ───────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // ── 3. Invisible watermark DOM node ───────────────────────────────────────
    if (!document.getElementById('efh-watermark')) {
      const wm = document.createElement('div');
      wm.id = 'efh-watermark';
      wm.style.cssText =
        'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;';
      wm.setAttribute('data-copyright', 'Elevate-for-Humanity-2025');
      wm.setAttribute('data-owner', 'Elizabeth-L-Greene');
      wm.setAttribute('data-page', window.location.pathname);
      document.body.appendChild(wm);
    }

    // ── 4. Anti-AI scraping meta tags ─────────────────────────────────────────
    const metasToAdd = [
      { name: 'robots', extra: 'noai, noimageai' },
      { name: 'googlebot', extra: 'noai, noimageai' },
    ];
    metasToAdd.forEach(({ name, extra }) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (existing) {
        const current = existing.getAttribute('content') ?? '';
        if (!current.includes('noai')) {
          existing.setAttribute('content', current ? `${current}, ${extra}` : extra);
        }
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', extra);
        document.head.appendChild(meta);
      }
    });

    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null;
}

/**
 * ContentIdentifier
 *
 * Drop into any page to embed a hidden content fingerprint.
 * Used by monitor-copycats.ts to detect copies via HTML inspection.
 */
export function ContentIdentifier({ pageId }: { pageId: string }) {
  return (
    <div
      style={{ display: 'none' }}
      data-content-id={`EFH-${pageId}`}
      data-copyright="Elevate-for-Humanity-2025"
      data-owner="Elizabeth-L-Greene"
      data-protection="DMCA-Protected"
    />
  );
}

/**
 * CopyrightFooter — visible footer bar with legal links.
 */
export function CopyrightFooter() {
  const year = new Date().getFullYear();
  return (
    <div className="bg-slate-900 text-white py-3 px-4 text-center text-sm">
      <p className="mb-1">© {year} {PLATFORM_DEFAULTS.orgName}. All Rights Reserved.</p>
      <div className="flex justify-center gap-4 text-xs text-slate-400">
        <Link href="/legal" className="hover:text-white transition-colors">Terms</Link>
        <span>|</span>
        <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
        <span>|</span>
        <a href="/dmca" className="hover:text-white transition-colors">DMCA</a>
      </div>
    </div>
  );
}

// Default export for next/dynamic
export default CopyrightProtection;
