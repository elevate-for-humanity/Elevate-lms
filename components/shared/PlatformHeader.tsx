'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import LogoImage from '@/components/site/LogoImage';
import SearchModal from '@/components/site/SearchModal.client';
import { NAV_ITEMS, type NavItem, type NavSubItem } from '@/lib/navigation';

// Map variant to filtered NAV_ITEMS
function getNavItemsForVariant(variant: 'marketing' | 'lms' | 'admin'): NavItem[] {
  switch (variant) {
    case 'admin':
      return NAV_ITEMS.filter(item => 
        ['admin', 'dashboard', 'students'].includes(item.id)
      );
    case 'lms':
      return NAV_ITEMS.filter(item => 
        ['lms', 'courses', 'progress'].includes(item.id)
      );
    default:
      return NAV_ITEMS;
  }
}

interface PlatformHeaderProps {
  variant?: 'marketing' | 'lms' | 'admin';
  className?: string;
}

export function PlatformHeader({ variant = 'marketing', className }: PlatformHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = getNavItemsForVariant(variant);

  return (
    <header className={cn(
      'sticky top-0 z-[9999] w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80',
      className
    )}>
      <nav className="container mx-auto flex h-[60px] items-center justify-between px-4">
        {/* Logo - using LogoImage for consistency */}
        <Link href={variant === 'admin' ? '/admin/dashboard' : variant === 'lms' ? '/lms/dashboard' : '/'} className="flex items-center gap-2">
          <LogoImage alt="Elevate" width={32} height={32} className="h-8 w-8" />
          <span className="font-bold text-lg text-gray-900">
            Elevate<span className="text-purple-600">4</span>Humanity
          </span>
        </Link>

        {/* Desktop Navigation - hidden on mobile, shown on md+ */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            return (
              <div 
                key={item.id || item.name} 
                className="relative"
                onMouseEnter={() => hasSubItems && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      pathname.startsWith(item.href)
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <button className={cn(
                    'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname.startsWith(item.href || '')
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}>
                    {item.name}
                    {hasSubItems && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                )}
                {hasSubItems && activeDropdown === item.name && (
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-md bg-white shadow-lg border py-1 z-50">
                    {item.subItems!.map((subItem: NavSubItem) => (
                      subItem.isHeader ? null : (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        >
                          {subItem.name}
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Modal - Available on all variants */}
          <SearchModal />

          {variant === 'marketing' && (
            <>
              <Link
                href="/login"
                className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
              >
                Apply Now
              </Link>
            </>
          )}
          {variant === 'lms' && (
            <div className="flex items-center gap-3">
              <Link
                href="/lms/notifications"
                className="relative p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Link>
              <Link
                href="/lms/profile"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-medium text-sm">ST</span>
                </div>
              </Link>
            </div>
          )}
          {variant === 'admin' && (
            <Link
              href="/admin/settings"
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          )}

          {/* Mobile Menu Button - shown on mobile, hidden on md+ */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu - shown when mobileMenuOpen is true, positioned below header */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.id || item.name}
                href={item.href || '#'}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 text-base font-medium rounded-md',
                  pathname.startsWith(item.href || '')
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.name}
              </Link>
            ))}
            {variant === 'marketing' && (
              <Link
                href="/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-purple-600 bg-purple-50 rounded-md"
              >
                Apply Now
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default PlatformHeader;
