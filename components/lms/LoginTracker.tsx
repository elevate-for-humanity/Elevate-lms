'use client';

import React from 'react';

import { useEffect } from 'react';

export default function LoginTracker() {
  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/events/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'LMS_DASHBOARD' }),
        });
      } catch (error) {
        /* Error handled silently */
        // Silently fail - don't disrupt user experience
        // Error: $1
      }
    })();
  }, []);

  return null;
}
