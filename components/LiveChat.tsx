'use client';

import React from 'react';

import { useEffect } from 'react';

/**
 * Live Chat Widget - Tawk.to Integration
 * Free, full-featured live chat system
 *
 * Setup:
 * 1. Sign up at https://www.tawk.to (FREE)
 * 2. Get your Property ID and Widget ID
 * 3. Add to environment variables:
 *    NEXT_PUBLIC_TAWK_PROPERTY_ID=your_property_id
 *    NEXT_PUBLIC_TAWK_WIDGET_ID=your_widget_id
 * 4. Widget will appear on all pages automatically
 */
export default function LiveChat() {
  useEffect(() => {
    // Check if Tawk.to is configured
    const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

    if (!propertyId || !widgetId) {
      return;
    }

    // Load Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    document.body.appendChild(script);

    // Cleanup
    return () => {
      // Remove Tawk.to widget on unmount
      const tawkWidget = document.getElementById('tawkId');
      if (tawkWidget) {
        tawkWidget.remove();
      }
    };
  }, []);

  return null; // Widget is injected by Tawk.to script
}
