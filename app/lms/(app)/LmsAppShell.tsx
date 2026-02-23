'use client';

import type { ReactNode } from 'react';
import { LMSSidebar } from '@/components/lms/LMSSidebar';
import { AIInstructorWidget } from '@/components/AIInstructorWidget';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';

interface LmsAppShellProps {
  user: { id: string; email?: string; user_metadata?: Record<string, any> };
  profile: any;
  children: ReactNode;
}

export function LmsAppShell({ user, profile, children }: LmsAppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <IdleTimeoutGuard />
      <LMSSidebar user={user} profile={profile} />

      {/* Main content — offset by sidebar width on desktop, below mobile header on mobile */}
      <main
        id="main-content"
        className="lg:ml-64 pt-14 lg:pt-0 min-h-screen"
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <AIInstructorWidget context="lesson" />
    </div>
  );
}
