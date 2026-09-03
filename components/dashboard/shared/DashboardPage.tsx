'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import type { UserRole, BreadcrumbItem, ActionItem, NavSection } from '@/lib/navigation/navigation-config';
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
    <div className="min-h-screen bg-slate-50">
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
        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
