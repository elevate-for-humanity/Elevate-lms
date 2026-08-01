import React from 'react';
import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Dev Studio | Elevate For Humanity',
  description: 'Unified development workspace for Elevate LMS',
  robots: { index: false, follow: false },
};

// Dev Studio is a standalone workspace - it provides its own shell
// No AdminNavShell wrapper - DevStudioUnifiedClient is the full interface
export default function DevStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {children}
    </div>
  );
}
