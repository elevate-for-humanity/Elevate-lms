'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ExternalLink } from 'lucide-react';
import type { NavSection, NavItem, UserRole } from '@/lib/navigation/navigation-config';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation/navigation-config';

interface DashboardSidebarProps {
  role: UserRole;
  sections: NavSection[];
  isOpen: boolean;
  onClose: () => void;
}

function isActiveHref(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

export function DashboardSidebar({ role, sections, isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {ROLE_DISPLAY_NAMES[role]}
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {sections.map((section) => (
              <div key={section.id} className="mb-4">
                {section.label && (
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {section.label}
                  </div>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveHref(item.href, pathname);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors
                        ${active 
                          ? 'bg-brand-blue-600 text-white' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                      `}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-brand-red-600 text-xs rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-700 space-y-1">
            <Link href="/lms/support" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm py-2">
              <Bell className="w-4 h-4" />
              Support
            </Link>
            <Link href="/lms/help" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm py-2">
              <ExternalLink className="w-4 h-4" />
              Help Center
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
