import React from 'react';
import { Metadata } from 'next';

// Root LMS layout - NO AUTH CHECKS HERE
// Auth is handled in app/lms/(app)/layout.tsx
// This layout wraps both public and protected routes
//
// SafeSearchParamsProvider is intentionally NOT mounted here —
// PublicLayout (app/layout.tsx → components/layout/PublicLayout.tsx) already
// wraps all routes including /lms/*. Mounting it again here caused a double
// Suspense boundary and redundant useSearchParams() call on every LMS route.

export const metadata: Metadata = {
  title: {
    default: 'Learning Portal | Elevate',
    template: '%s | Elevate Learn',
  },
  description: 'Access your courses, track progress, and earn certifications.',
  manifest: '/manifest-student.json',
  robots: { index: false, follow: false },
};

export default function LMSLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
