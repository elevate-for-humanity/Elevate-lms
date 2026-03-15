"use client";

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

/**
 * PROGRAM HOLDER NAVIGATION
 *
 * Sidebar navigation for program holders (training providers/partners).
 * Focus: Student management, compliance, reporting, MOUs.
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
    href: '/program-holder/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Students',
    icon: Users,
    children: [
      { name: 'All Students', href: '/program-holder/students', icon: Users },
      {
        name: 'Enrollments',
        href: '/program-holder/enrollments',
        icon: FileText,
      },
      {
        name: 'At-Risk Students',
        href: '/program-holder/at-risk',
        icon: AlertCircle,
      },
    ],
  },
  {
    name: 'Compliance',
    icon: Shield,
    children: [
      { name: 'Overview', href: '/program-holder/compliance', icon: Shield },
      {
        name: 'Reports',
        href: '/program-holder/compliance/reports',
        icon: FileText,
      },
      {
        name: 'Verifications',
        href: '/program-holder/verifications',
        icon: Shield,
      },
    ],
  },
  {
    name: 'Documents',
    icon: FileText,
    children: [
      { name: 'MOUs', href: '/program-holder/documents/mous', icon: FileText },
      {
        name: 'Agreements',
        href: '/program-holder/documents/agreements',
        icon: FileText,
      },
      {
        name: 'Uploads',
        href: '/program-holder/documents/uploads',
        icon: FileText,
      },
    ],
  },
  {
    name: 'Settings',
    href: '/program-holder/settings',
    icon: Settings,
  },
];

export default function ProgramHolderNav() {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
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
            <div className="text-xs text-gray-400 -mt-1">Program Holder</div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="space-y-1">
        {navigation.map((item) => {
          if ('children' in item) {
            // Nav group with children
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
            // Single nav item
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
          href="/support"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition"
        >
          <AlertCircle className="w-4 h-4" />
          Help & Support
        </Link>
      </div>
    </nav>
  );
}
