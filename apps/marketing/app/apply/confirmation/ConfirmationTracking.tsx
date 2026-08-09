'use client';

import { useEffect, useState } from 'react';

interface ApplicationData {
  first_name?: string;
  last_name?: string;
  email?: string;
  program?: string;
  submitted_at?: string;
}

export default function ConfirmationTracking() {
  const [application, setApplication] = useState<ApplicationData | null>(null);

  useEffect(() => {
    // Try to get application data from session storage (set by apply form)
    try {
      const stored = sessionStorage.getItem('elevate_application');
      if (stored) {
        const data = JSON.parse(stored);
        setApplication(data);
        // Clear after reading (don't want to persist sensitive data)
        sessionStorage.removeItem('elevate_application');
      }
    } catch {
      // Non-critical — if session storage fails, just don't show tracking
    }

    // After a successful application, prepare the WorkOne handoff only when
    // the saved application is actually WIOA/WRG funded. The API is idempotent,
    // so refreshing the confirmation page will not resend the packet.
    try {
      const reference = new URLSearchParams(window.location.search).get('ref');
      if (reference?.startsWith('EFH-')) {
        void fetch('/api/workone/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ reference }),
        }).catch(() => undefined);
      }
    } catch {
      // Non-critical — the original application remains submitted even if the
      // handoff email service is temporarily unavailable.
    }
  }, []);

  if (!application) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Application Submitted',
          description: `${application.first_name || ''} ${application.last_name || ''} submitted application for ${application.program || 'Elevate program'}`,
        }),
      }}
    />
  );
}
