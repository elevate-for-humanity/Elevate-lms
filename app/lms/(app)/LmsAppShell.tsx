'use client';

import type { ReactNode } from 'react';
import { LMSNavigation } from '@/components/lms/LMSNavigation';
import { AIInstructorWidget } from '@/components/AIInstructorWidget';
import { LogoStamp } from '@/components/layout/LogoBanner';
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
      <LMSNavigation user={user} profile={profile} />
      <main id="main-content">{children}</main>
      <LogoStamp />
      <AIInstructorWidget context="lesson" />
    </div>
  );
}
