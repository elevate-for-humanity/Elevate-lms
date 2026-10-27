'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import type {
  UserRole,
  BreadcrumbItem,
  ActionItem,
  NavSection,
} from '@/lib/navigation/navigation-config';
import { getNavigationForRole, generateBreadcrumbs } from '@/lib/navigation/navigation-config';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sections = getNavigationForRole(role);
  const autoBreadcrumbs = breadcrumbs || generateBreadcrumbs(window.location.pathname);

  return (
    <div
      data-elevate-dashboard-shell={role}
      className="min-h-screen w-full overflow-x-clip bg-slate-50"
    >
      {/* Header */}
      <DashboardHeader
        user={user}
        role={role}
        breadcrumbs={autoBreadcrumbs}
        actions={actions}
        notifications={notifications}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar
          role={role}
          sections={sections}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main data-elevate-dashboard-content className="min-w-0 w-full flex-1">
          <div className="w-full max-w-none p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
