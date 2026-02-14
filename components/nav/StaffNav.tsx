"use client";

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CheckSquare,
  Calendar,
  Settings,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

/**
 * STAFF NAVIGATION
 *
 * Sidebar navigation for staff members.
 * Focus: Student support, partner oversight, task management.
 */

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
}

const navigation: (NavItem | NavGroup)[] = [
  {
    name: 'Dashboard',
    href: '/staff-portal/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Students',
    icon: Users,
    children: [
      { name: 'All Students', href: '/staff-portal/students', icon: Users },
      { name: 'At-Risk', href: '/staff-portal/students/at-risk', icon: Users },
      {
        name: 'Pending Enrollments',
        href: '/staff-portal/students/pending',
        icon: Users,
      },
    ],
  },
  {
    name: 'Program Holders',
    icon: Building2,
    children: [
      { name: 'All Partners', href: '/staff-portal/partners', icon: Building2 },
      {
        name: 'Verifications',
        href: '/staff-portal/partners/verifications',
        icon: CheckSquare,
      },
    ],
  },
  {
    name: 'Reports',
    icon: FileText,
    children: [
      {
        name: 'Compliance',
        href: '/staff-portal/reports/compliance',
        icon: FileText,
      },
      {
        name: 'Enrollment',
        href: '/staff-portal/reports/enrollment',
        icon: FileText,
      },
      {
        name: 'Outcomes',
        href: '/staff-portal/reports/outcomes',
        icon: FileText,
      },
    ],
  },
  {
    name: 'Tasks',
    href: '/staff-portal/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Calendar',
    href: '/staff-portal/calendar',
    icon: Calendar,
  },
  {
    name: 'Settings',
    href: '/staff-portal/settings',
    icon: Settings,
  },
];

export default function StaffNav() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isGroupActive = (children: NavItem[]) => {
    return children.some((child) => isActive(child.href));
  };

  return (
    <nav role="navigation" aria-label="Main navigation" className="w-64 bg-gray-900 text-white min-h-screen p-4 overflow-y-auto">
      {/* Logo/Brand */}
      <div className="mb-8">
        <Link href="/" aria-label="Link" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-600">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="text-lg font-bold">Elevate</div>
            <div className="text-xs text-gray-400 -mt-1">Staff Portal</div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="space-y-1">
        {navigation.map((item) => {
          if ('children' in item) {
            const isExpanded = expandedGroups.includes(item.name);
            const hasActiveChild = isGroupActive(item.children);

            return (
              <div key={item.name} className="mb-2">
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition ${
                    hasActiveChild
                      ? 'bg-brand-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const active = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
                            active
                              ? 'bg-brand-blue-600 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <child.icon className="w-4 h-4" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          } else {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                  active
                    ? 'bg-brand-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          }
        })}
      </div>

      {/* Help/Support */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <Link
          href="/help"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition"
        >
          <HelpCircle className="w-4 h-4" />
          Help & Support
        </Link>
      </div>
    </nav>
  );
}
