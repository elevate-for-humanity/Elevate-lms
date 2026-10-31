'use client';

import React from 'react';
import { PlatformShell } from '@/components/platform/PlatformShell';
import type { UserRole, BreadcrumbItem, ActionItem } from '@/lib/navigation/navigation-config';

interface DashboardPageProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  role: UserRole;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionItem[];
  notifications?: number;
  children: React.ReactNode;
}

export function DashboardPage({
  user,
  role,
  breadcrumbs,
  actions = [],
  notifications = 0,
  children,
}: DashboardPageProps) {
  return (
    <PlatformShell
      user={user}
      role={role}
      breadcrumbs={breadcrumbs}
      actions={actions}
      notifications={notifications}
    >
      {children}
    </PlatformShell>
  );
}
