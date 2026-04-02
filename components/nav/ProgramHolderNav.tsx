"use client";

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Settings,
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

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/program-holder/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Students',
    href: '/program-holder/students',
    icon: Users,
  },
  {
    name: 'At-Risk',
    href: '/program-holder/students/at-risk',
    icon: AlertCircle,
  },
  {
    name: 'Compliance',
    href: '/program-holder/compliance',
    icon: Shield,
  },
  {
    name: 'Documents',
    href: '/program-holder/documents',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/program-holder/settings',
    icon: Settings,
  },
];

export default function ProgramHolderNav() {
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
            <div className="text-xs text-gray-400 -mt-1">Program Holder</div>
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
          <AlertCircle className="w-4 h-4" />
          Help & Support
        </Link>
      </div>
    </nav>
  );
}
