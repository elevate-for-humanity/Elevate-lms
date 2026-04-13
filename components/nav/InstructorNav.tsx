"use client";

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  HelpCircle,
  ClipboardCheck,
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

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/instructor/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Courses',
    href: '/instructor/courses',
    icon: BookOpen,
  },
  {
    name: 'Students',
    href: '/instructor/students',
    icon: Users,
  },
  {
    name: 'Sign-off Queue',
    href: '/instructor/submissions',
    icon: ClipboardCheck,
  },
  {
    name: 'Settings',
    href: '/instructor/settings',
    icon: Settings,
  },
];

export default function InstructorNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
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
            <div className="text-xs text-gray-400 -mt-1">Instructor</div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="space-y-1">
        {navigation.map((item) => {
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
