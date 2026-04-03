"use client";

import React from 'react';
import { useEffect, useState } from 'react';
/**
 * Invisible Watermark Component
 *
 * This component embeds hidden tracking information throughout your site that:
 * 1. Is invisible to users
 * 2. Survives copy/paste
 * 3. Can be detected if someone copies your site
 * 4. Helps prove ownership in legal cases
 *
 * Multiple layers of protection:
 * - Hidden HTML comments
 * - Invisible text elements
 * - Meta tags
 * - CSS-based markers
 * - JavaScript fingerprinting
 */
interface WatermarkProps {
  owner?: string;
  siteId?: string;
  timestamp?: string;
}
export function InvisibleWatermark({
  owner = 'Elizabeth L. Greene / Elevate for Humanity',
  siteId = 'EFH-ORIGINAL-2024',
  timestamp,
}: WatermarkProps) {
  // Generate timestamp only on client after mount to avoid hydration mismatch
  const [clientTimestamp, setClientTimestamp] = useState<string>('');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setClientTimestamp(timestamp || new Date().toISOString());
      }
    } catch (error) { /* Error handled silently */ 
    }
  }, [timestamp]);

  const finalTimestamp = clientTimestamp;
  useEffect(() => {
    if (!clientTimestamp || typeof window === 'undefined') return; // Wait for timestamp to be set

    try {
      // Add invisible watermark to body
      const watermarkText = `ORIGINAL-SITE-${siteId}-${clientTimestamp}-OWNER-${owner}`;
      // Method 1: Hidden div with zero opacity (truly invisible)
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.cssText =
        'position:absolute;width:0;height:0;opacity:0;visibility:hidden;overflow:hidden;pointer-events:none;clip:rect(0,0,0,0);';
      hiddenDiv.setAttribute('data-site-owner', owner);
      hiddenDiv.setAttribute('data-site-id', siteId);
      hiddenDiv.setAttribute('data-original-timestamp', clientTimestamp);
      hiddenDiv.setAttribute('aria-hidden', 'true');
      hiddenDiv.textContent = watermarkText;
      document.body.appendChild(hiddenDiv);
    // Method 2: Add to console (visible to developers who copy)
    // Method 3: Add invisible text throughout the page
    const addInvisibleMarkers = () => {
      const markers = [
        `<!--ORIGINAL-SITE-${siteId}-->`,
        `<!--COPYRIGHT-${owner}-->`,
        `<!--TIMESTAMP-${clientTimestamp}-->`,
        `<!--DO-NOT-COPY-LEGAL-ACTION-WILL-BE-TAKEN-->`,
      ];
      markers.forEach((marker) => {
        const comment = document.createComment(marker);
        document.body.appendChild(comment);
      });
    };
    addInvisibleMarkers();
    // Method 4: Add to localStorage (persists across sessions)
    try {
      localStorage.setItem('site_original_owner', owner);
      localStorage.setItem('site_original_id', siteId);
      localStorage.setItem('site_original_timestamp', clientTimestamp);
    } catch (e) {
      // Ignore if localStorage is disabled
    }
    // Method 5: Detect if site is being viewed in iframe (common scraping technique)
    if (window.self !== window.top) {
      // Error logged
      // Optionally break out of iframe
      // window.top.location = window.self.location;
    }
      // Method 6: Add fingerprint to page
      const fingerprint = generateFingerprint();
      const fpDiv = document.createElement('div');
      fpDiv.style.display = 'none';
      fpDiv.setAttribute('data-fp', fingerprint);
      document.body.appendChild(fpDiv);
    } catch (error) { /* Error handled silently */ 
    }
  }, [owner, siteId, clientTimestamp]);
  try {
    // All watermark content is now truly invisible - using display:none
    // Meta tags provide ownership info without visible rendering
    // The actual watermark text is injected via useEffect into hidden DOM elements
    return (
      <>
        {/* Hidden meta tags for ownership - these don't render visibly */}
        <meta name="site-owner" content={owner} />
        <meta name="site-id" content={siteId} />
        {clientTimestamp && (
          <meta name="original-timestamp" content={clientTimestamp} />
        )}
        <meta
          name="copyright"
          content={`© 2025 ${owner}. All Rights Reserved.`}
        />
      </>
    );
  } catch (error) { /* Error handled silently */ 
    return null;
  }
}
/**
 * Generate a unique fingerprint for this site instance
 */
function generateFingerprint(): string {
  try {
    if (typeof window === 'undefined') return 'EFH-SERVER';

    const data = [
      navigator.userAgent,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.language,
      'EFH-ORIGINAL',
    ].join('|');
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return 'EFH-' + Math.abs(hash).toString(36).toUpperCase();
  } catch (error) { /* Error handled silently */ 
    return 'EFH-ERROR';
  }
}
/**
 * Visible Watermark Component (for demos/screenshots)
 * Use this when showing the platform to anyone
 */
export function VisibleWatermark({
  text = 'CONFIDENTIAL DEMO',
  email = '',
  showTimestamp = true,
}: {
  text?: string;
  email?: string;
  showTimestamp?: boolean;
}) {
  const timestamp = new Date().toLocaleString('en-US');
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        fontSize: '11px',
        borderRadius: '4px',
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{text}</div>
      {email && (
        <div style={{ fontSize: '10px', opacity: 0.8 }}>Viewer: {email}</div>
      )}
      {showTimestamp && (
        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>
          {timestamp}
        </div>
      )}
      <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>
        © 2025 Elevate for Humanity
      </div>
    </div>
  );
}
/**
 * DMCA Tracking Pixel
 * Embeds a tracking pixel that phones home when page is loaded
 * Helps detect if your site is being copied/hosted elsewhere
 */
export function DMCATrackingPixel() {
  useEffect(() => {
    // Only track in production
    if (process.env.NODE_ENV !== 'production') return;
    const trackingData = {
      siteId: 'EFH-ORIGINAL-2024',
      owner: 'Elevate for Humanity',
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    // Send tracking beacon to detect unauthorized copies
    fetch('/api/track-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
      keepalive: true, // Ensures request completes even if user navigates away
    }).catch((error) => {
      // Silently fail - don't disrupt user experience
    });
  }, []);
  return null;
}
