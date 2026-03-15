"use client";

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  MessageCircle,
  Calendar,
  Settings,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

/**
 * INSTRUCTOR NAVIGATION
 *
 * Sidebar navigation for instructors.
 * Focus: Course management, student progress, grading, communication.
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
    href: '/instructor/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Courses',
    icon: BookOpen,
    children: [
      { name: 'All Courses', href: '/instructor/courses', icon: BookOpen },
      { name: 'Active', href: '/instructor/courses/active', icon: BookOpen },
      {
        name: 'Archived',
        href: '/instructor/courses/archived',
        icon: BookOpen,
      },
    ],
  },
  {
    name: 'Students',
    icon: Users,
    children: [
      { name: 'All Students', href: '/instructor/students', icon: Users },
      {
        name: 'Progress Tracking',
        href: '/instructor/students/progress',
        icon: Users,
      },
      { name: 'At-Risk', href: '/instructor/students/at-risk', icon: Users },
    ],
  },
  {
    name: 'Grading',
    icon: ClipboardCheck,
    children: [
      {
        name: 'Pending',
        href: '/instructor/grading/pending',
        icon: ClipboardCheck,
      },
      {
        name: 'Completed',
        href: '/instructor/grading/completed',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    name: 'Messages',
    href: '/instructor/messages',
    icon: MessageCircle,
  },
  {
    name: 'Calendar',
    href: '/instructor/calendar',
    icon: Calendar,
  },
  {
    name: 'Settings',
    href: '/instructor/settings',
    icon: Settings,
  },
];

export default function InstructorNav() {
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
            <div className="text-xs text-gray-400 -mt-1">Instructor</div>
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
          href="/support"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition"
        >
          <HelpCircle className="w-4 h-4" />
          Help & Support
        </Link>
      </div>
    </nav>
  );
}
