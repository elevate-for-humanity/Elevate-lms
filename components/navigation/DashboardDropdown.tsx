'use client';

import React from 'react';

import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  Briefcase,
  BookOpen,
  Palette,
  Shield,
  ShoppingBag,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const DASHBOARDS = [
  {
    name: 'Admin',
    href: '/admin/dashboard',
    icon: Shield,
    description: 'System management',
    color: 'text-red-600',
  },
  {
    name: 'Student',
    href: '/lms/dashboard',
    icon: GraduationCap,
    description: 'Learning portal',
    color: 'text-blue-600',
  },
  {
    name: 'Staff',
    href: '/staff-portal/dashboard',
    icon: Users,
    description: 'Support operations',
    color: 'text-green-600',
  },
  {
    name: 'Program Holder',
    href: '/program-holder/dashboard',
    icon: Building2,
    description: 'Training providers',
    color: 'text-brand-red-600',
  },
  {
    name: 'Employer',
    href: '/employer/dashboard',
    icon: Briefcase,
    description: 'Hiring portal',
    color: 'text-orange-600',
  },
  {
    name: 'Instructor',
    href: '/instructor/dashboard',
    icon: BookOpen,
    description: 'Teaching tools',
    color: 'text-indigo-600',
  },
  {
    name: 'Creator',
    href: '/creator/dashboard',
    icon: Palette,
    description: 'Community courses',
    color: 'text-pink-600',
  },
  {
    name: 'AI Studio',
    href: '/ai-studio',
    icon: Sparkles,
    description: 'AI video & media',
    color: 'text-brand-red-600',
  },
  {
    name: 'Delegate',
    href: '/delegate/dashboard',
    icon: Shield,
    description: 'Moderation',
    color: 'text-yellow-600',
  },
  {
    name: 'Shop',
    href: '/shop/dashboard',
    icon: ShoppingBag,
    description: 'Store management',
    color: 'text-teal-600',
  },
];

export function DashboardDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:text-black hover:bg-slate-100 rounded-lg transition"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboards</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                All Dashboards
              </div>
              <div className="space-y-1">
                {DASHBOARDS.map((dashboard) => {
                  const Icon = dashboard.icon;
                  return (
                    <Link
                      key={dashboard.href}
                      href={dashboard.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition group"
                    >
                      <Icon
                        className={`w-5 h-5 mt-0.5 ${dashboard.color} group-hover:scale-110 transition`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black group-hover:text-blue-600">
                          {dashboard.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dashboard.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 p-2">
              <Link
                href="/dashboards"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50 rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                View All Dashboards
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
