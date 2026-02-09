"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';
import { useEffect, useRef } from 'react';

/**
 * Scraper Detection Component
 * Detects suspicious behavior that indicates automated scraping
 */
export function ScraperDetection() {
  const mouseMovements = useRef(0);
  const scrollEvents = useRef(0);
  const clickEvents = useRef(0);
  const startTime = useRef(Date.now());
  const alerted = useRef(false);
  const supabase = createClient();

  // Log scraper detection event to DB
  const logScraperEvent = async (eventData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('scraper_detection_events')
      .insert({
        user_id: user?.id,
        event_type: eventData.type,
        url: eventData.url,
        details: eventData,
        user_agent: navigator.userAgent,
        detected_at: new Date().toISOString()
      });
  };
  useEffect(() => {
    // Track mouse movements
    const handleMouseMove = () => {
      mouseMovements.current++;
    };
    // Track scrolling
    const handleScroll = () => {
      scrollEvents.current++;
    };
    // Track clicks
    const handleClick = () => {
      clickEvents.current++;
    };
    // Track copy events
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() || '';
      if (selection.length > 100) {
        sendAlert({
          type: 'LARGE_COPY',
          url: window.location.href,
          textLength: selection.length,
          timestamp: new Date().toISOString()
        });
      }
    };
    // Track right-click (often used before "View Source")
    const handleContextMenu = () => {
      sendAlert({
        type: 'RIGHT_CLICK',
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    };
    // Track keyboard shortcuts for DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'i' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        sendAlert({
          type: 'DEVTOOLS_SHORTCUT',
          url: window.location.href,
          key: e.key,
          timestamp: new Date().toISOString()
        });
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    // Check for bot behavior after 5 seconds
    const checkTimer = setTimeout(() => {
      if (alerted.current) return;
      const timeOnPage = Date.now() - startTime.current;
      // If no mouse movement, scrolling, or clicks = likely bot
      if (mouseMovements.current === 0 &&
          scrollEvents.current === 0 &&
          clickEvents.current === 0 &&
          timeOnPage > 5000) {
        alerted.current = true;
        sendAlert({
          type: 'NO_HUMAN_BEHAVIOR',
          url: window.location.href,
          timeOnPage,
          mouseMovements: mouseMovements.current,
          scrollEvents: scrollEvents.current,
          clickEvents: clickEvents.current,
          timestamp: new Date().toISOString()
        });
      }
    }, 5000);
    // Check for DevTools opening (on resize, not every second)
    const detectDevTools = () => {
      // Guard against undefined window properties on mobile
      if (typeof window === 'undefined' || !window.outerWidth || !window.outerHeight) {
        return;
      }
      
      if (alerted.current) return; // Only alert once
      
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        alerted.current = true;
        sendAlert({
          type: 'DEVTOOLS_OPENED',
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      }
    };
    
    // Check on mount and on resize (not every second)
    detectDevTools();
    window.addEventListener('resize', detectDevTools);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', detectDevTools);
      clearTimeout(checkTimer);
    };
  }, []);
  return null;
}
function sendAlert(data: Record<string, any>) {
  // Fire-and-forget with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  
  fetch('/api/alert-scraper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    keepalive: true,
    signal: controller.signal
  })
    .then(() => clearTimeout(timeoutId))
    .catch(() => clearTimeout(timeoutId));
}
