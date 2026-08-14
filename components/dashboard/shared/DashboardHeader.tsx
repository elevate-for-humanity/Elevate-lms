'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, Menu, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import type { BreadcrumbItem, ActionItem, UserRole } from '@/lib/navigation/navigation-config';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation/navigation-config';

interface DashboardHeaderProps {
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
  onMenuClick?: () => void;
}

export function DashboardHeader({
  user,
  role,
  breadcrumbs = [],
  actions = [],
  notifications = 0,
  onMenuClick,
}: DashboardHeaderProps) {
  const userInitials = user.first_name && user.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`
    : user.full_name
      ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
      : 'U';

  const userName = user.full_name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'User');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Logo + Menu */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-slate-900 hidden md:block">{ROLE_DISPLAY_NAMES[role]}</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Actions */}
          {actions.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 mr-4">
              {actions.slice(0, 2).map((action) => (
                action.href ? (
                  <Link
                    key={action.id}
                    href={action.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      action.variant === 'primary'
                        ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      action.variant === 'primary'
                        ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {action.label}
                  </button>
                )
              ))}
            </div>
          )}

          {/* Notifications */}
          <Link
            href="/lms/notifications"
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red-600 text-white text-xs rounded-full flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </Link>

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userInitials}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
            </button>
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-medium text-slate-900">{userName}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <Link href="/lms/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700">
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link href="/lms/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <hr className="my-2 border-slate-100" />
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 w-full text-left">
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
          <nav className="flex items-center gap-2 text-sm max-w-7xl mx-auto">
            <Link href="/" className="text-slate-500 hover:text-slate-700">Home</Link>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <span className="text-slate-300">/</span>
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="text-slate-500 hover:text-slate-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
