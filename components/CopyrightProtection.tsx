"use client";

import React from 'react';
import { useEffect } from 'react';
/**
 * Copyright Protection Component
 * Adds multiple layers of protection against content theft
 */
export function CopyrightProtection() {
  useEffect(() => {
    // 1. Disable right-click context menu on images and text
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('.protected-content')) {
        e.preventDefault();
        showCopyrightNotice();
      }
    };
    // 2. Detect and prevent text selection copying
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 100) {
        e.preventDefault();
        // Add copyright notice to clipboard
        const copyrightNotice = `\n\n---\n© 2025 Elevate for Humanity. All Rights Reserved.\nSource: ${window.location.href}\n`;
        e.clipboardData?.setData('text/plain', selection + copyrightNotice);
        showCopyrightNotice();
      }
    };
    // 3. Detect screenshot attempts (limited browser support)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen key
      if (e.key === 'PrintScreen') {
        showCopyrightNotice();
      }
      // Ctrl+Shift+S (Firefox screenshot)
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        showCopyrightNotice();
      }
    };
    // 4. Detect developer tools opening
    const detectDevTools = () => {
      // Guard against undefined window properties on mobile
      if (typeof window === 'undefined' || !window.outerWidth || !window.outerHeight) {
        return;
      }
      
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        console.clear();
      }
    };
    // 5. Add invisible watermark to page
    const addInvisibleWatermark = () => {
      const watermark = document.createElement('div');
      watermark.style.cssText =
        'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      watermark.setAttribute('data-copyright', 'Elevate-for-Humanity-2025');
      watermark.setAttribute('data-timestamp', Date.now().toString());
      watermark.setAttribute('data-page', window.location.pathname);
      document.body.appendChild(watermark);
    };
    // 6. Add meta tags to prevent AI scraping
    const addAntiAIMetaTags = () => {
      const metaTags = [
        { name: 'robots', content: 'noai, noimageai' },
        { name: 'googlebot', content: 'noai, noimageai' },
        { property: 'og:restrictions:age', content: '18+' },
      ];
      metaTags.forEach(({ name, property, content }) => {
        const existing = document.querySelector(
          `meta[${name ? 'name' : 'property'}="${name || property}"]`
        );
        if (!existing) {
          const meta = document.createElement('meta');
          if (name) meta.setAttribute('name', name);
          if (property) meta.setAttribute('property', property);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      });
    };
    // Attach event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', detectDevTools);
    // Initialize protections
    addInvisibleWatermark();
    addAntiAIMetaTags();
    detectDevTools();
    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', detectDevTools);
    };
  }, []);
  return null; // This component doesn't render anything
}
/**
 * Show copyright notice to user
 */
function showCopyrightNotice() {
  // Check if notice already exists
  if (document.getElementById('copyright-notice')) return;
  const notice = document.createElement('div');
  notice.id = 'copyright-notice';
  notice.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 30px;
    border-radius: 10px;
    z-index: 999999;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  `;
  notice.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 15px;">ℹ️</div>
    <h2 style="margin: 0 0 10px 0; font-size: 20px;">Protected Content</h2>
    <p style="margin: 0 0 15px 0; line-height: 1.5; font-size: 14px;">
      © 2025 Elevate for Humanity. All Rights Reserved.
    </p>
    <button id="close-notice" style="
      background: #f97316;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 5px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
    ">
      OK
    </button>
  `;
  document.body.appendChild(notice);
  // Close button
  document.getElementById('close-notice')?.addEventListener('click', () => {
    notice.remove();
  });
  // Au after 5 seconds
  setTimeout(() => {
    notice.remove();
  }, 5000);
}
/**
 * Visible Copyright Footer Component - Simplified and Student-Friendly
 */
export function CopyrightFooter() {
  return (
    <div className="bg-slate-900 text-white py-3 px-4 text-center text-sm">
      <p className="mb-2 text-gray-300">
        © 2025 Elevate for Humanity. All Rights Reserved.
      </p>
      <div className="flex justify-center gap-4 text-xs text-gray-400">
        <a href="/terms-of-service" className="hover:text-white">
          Terms
        </a>
        <span>|</span>
        <a href="/privacy-policy" className="hover:text-white">
          Privacy
        </a>
        <span>|</span>
        <a href="/dmca" className="hover:text-white">
          DMCA
        </a>
      </div>
    </div>
  );
}
/**
 * Unique Content Identifier
 * Adds invisible tracking to content
 */
export function ContentIdentifier({ pageId }: { pageId: string }) {
  return (
    <div
      style={{ display: 'none' }}
      data-content-id={`EFH-${pageId}-${Date.now().toString(36)}`}
      data-copyright="Elevate-for-Humanity-2025"
      data-owner="Elizabeth-L-Greene"
      data-protection="DMCA-Protected"
    >
      {/* Invisible content identifier for tracking */}
    </div>
  );
}
