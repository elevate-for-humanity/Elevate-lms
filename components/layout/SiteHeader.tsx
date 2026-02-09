'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { DashboardDropdown } from '@/components/navigation/DashboardDropdown';
import { SearchBar } from '@/components/navigation/SearchBar';
import { ProfileDropdown } from '@/components/navigation/ProfileDropdown';

// STUDENT-FIRST NAVIGATION - Locked for 30 days
// Only paths that move students toward enrollment
const NAV_ITEMS = [
  { 
    name: 'Programs', 
    href: '/programs',
    subItems: [
      { name: 'Healthcare', href: '/programs/healthcare' },
      { name: 'Skilled Trades', href: '/programs/skilled-trades' },
      { name: 'Technology', href: '/programs/technology' },
      { name: 'Business', href: '/programs/business' },
      { name: 'All Programs', href: '/programs' },
    ]
  },
  { 
    name: 'How It Works', 
    href: '/how-it-works',
    subItems: [
      { name: 'Check Eligibility', href: '/enroll' },
      { name: 'Funding Options', href: '/funding' },
      { name: 'FAQ', href: '/faq' },
    ]
  },
  { 
    name: 'About', 
    href: '/about',
    subItems: [
      { name: 'Our Mission', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ]
  },
];

// Desktop navigation links with dropdowns
// STUDENT-FIRST: Only paths that move students toward enrollment
const DESKTOP_NAV_LINKS = [
  { 
    name: 'Programs', 
    href: '/programs',
    subItems: [
      { name: 'All Programs', href: '/programs' },
      { name: 'Healthcare', href: '/programs/healthcare' },
      { name: 'Skilled Trades', href: '/programs/skilled-trades' },
      { name: 'Technology', href: '/programs/technology' },
      { name: 'Business', href: '/programs/business' },
    ]
  },
  { 
    name: 'How It Works', 
    href: '/how-it-works',
    subItems: [
      { name: 'Overview', href: '/how-it-works' },
      { name: 'Check Eligibility', href: '/enroll' },
      { name: 'Funding Options', href: '/funding' },
      { name: 'FAQ', href: '/faq' },
    ]
  },
  { 
    name: 'About', 
    href: '/about',
    subItems: [
      { name: 'Our Mission', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ]
  },
];

// Safe user hook that never throws
function useSafeUser() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const controller = new AbortController();
    
    fetch('/api/auth/me', { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null));
    
    return () => controller.abort();
  }, []);
  
  return user;
}

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const user = useSafeUser();
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  // Check if a link is active
  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  const toggleDropdown = useCallback((name: string) => {
    setOpenDropdown(prev => prev === name ? null : name);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    // Return focus to menu button when closing
    menuButtonRef.current?.focus();
  }, []);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  // Handle escape key and focus trap
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        return;
      }

      // Focus trap
      if (e.key === 'Tab') {
        const menu = mobileMenuRef.current;
        if (!menu) return;

        const focusableElements = menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus close button when menu opens
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {mobileMenuOpen ? 'Navigation menu opened' : ''}
      </div>

      <header 
        className="fixed top-0 left-0 right-0 h-[70px] bg-white z-[9999] shadow-md"
        role="banner"
      >
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
            aria-label="Elevate for Humanity - Home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="w-10 h-10"
              priority
              fetchPriority="high"
              aria-hidden="true"
            />
            <span className="font-bold text-lg text-gray-900 hidden sm:inline">
              Elevate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav 
            className="hidden lg:flex items-center gap-1" 
            role="navigation" 
            aria-label="Main navigation"
          >
            <SearchBar className="mr-4 hidden xl:block" />
            <DashboardDropdown className="mr-2" />
            {DESKTOP_NAV_LINKS.map((link) => (
              <div key={link.href} className="relative group">
                <Link 
                  href={link.href} 
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                    ${isActive(link.href) 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }
                  `}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.name}
                  {link.subItems && <ChevronDown className="w-3 h-3" />}
                </Link>
                {link.subItems && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {link.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-4 py-2 text-sm ${
                          isActive(subItem.href)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile Dropdown - shows when logged in */}
            {user ? (
              <ProfileDropdown className="hidden lg:block" />
            ) : (
              <Link
                href="/login"
                className="hidden lg:inline-flex px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Sign In
              </Link>
            )}

            {/* Apply Now CTA */}
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-blue-600 !text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[44px]"
              style={{ color: 'white' }}
            >
              Apply Now
            </Link>

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              onClick={openMobileMenu}
              className="lg:hidden flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] bg-gray-100 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="dialog"
            >
              <Menu className="w-6 h-6 text-gray-900" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <nav 
          ref={mobileMenuRef}
          id="mobile-menu"
          className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-white z-[10000] overflow-y-auto shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <Link 
              href="/" 
              onClick={closeMobileMenu} 
              className="flex items-center gap-2 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
            >
              <Image src="/logo.png" alt="" width={32} height={32} aria-hidden="true" />
              <span className="font-bold text-gray-900">Elevate</span>
            </Link>
            <button
              ref={closeButtonRef}
              onClick={closeMobileMenu}
              className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] bg-transparent border-none cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6 text-gray-700" aria-hidden="true" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-4" role="menu">
            {NAV_ITEMS.map((item) => (
              <div key={item.name} className="mb-1" role="none">
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`
                        flex items-center justify-between w-full px-4 py-3 text-base font-semibold rounded-lg cursor-pointer text-left border-none transition-colors
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                        ${openDropdown === item.name ? 'bg-gray-100 text-blue-600' : 'bg-transparent text-gray-900 hover:bg-gray-50'}
                      `}
                      aria-expanded={openDropdown === item.name}
                      aria-controls={`submenu-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                      role="menuitem"
                    >
                      {item.name}
                      <ChevronDown 
                        className={`w-5 h-5 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} 
                        aria-hidden="true" 
                      />
                    </button>
                    {openDropdown === item.name && (
                      <div 
                        id={`submenu-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                        className="ml-4 border-l-2 border-gray-200 mt-1"
                        role="menu"
                        aria-label={`${item.name} submenu`}
                      >
                        <Link
                          href={item.href}
                          onClick={closeMobileMenu}
                          className={`
                            block px-4 py-2 text-sm font-medium no-underline transition-colors
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                            ${isActive(item.href) ? 'text-blue-600 bg-blue-50' : 'text-blue-600 hover:bg-gray-50'}
                          `}
                          role="menuitem"
                          aria-current={isActive(item.href) ? 'page' : undefined}
                        >
                          View All {item.name}
                        </Link>
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={closeMobileMenu}
                            className={`
                              block px-4 py-2 text-sm no-underline transition-colors
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                              ${isActive(subItem.href) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}
                            `}
                            role="menuitem"
                            aria-current={isActive(subItem.href) ? 'page' : undefined}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`
                      block px-4 py-3 text-base font-semibold no-underline rounded-lg transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                      ${isActive(item.href) ? 'text-blue-600 bg-blue-50' : 'text-gray-900 hover:bg-gray-50'}
                    `}
                    role="menuitem"
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}

            {/* Bottom Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200" role="none">
              <Link
                href={user ? "/lms/dashboard" : "/login"}
                onClick={closeMobileMenu}
                className="block w-full p-3 text-center text-base font-medium text-gray-700 border border-gray-300 rounded-full no-underline mb-3 hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                role="menuitem"
              >
                {user ? 'Dashboard' : 'Sign In'}
              </Link>
              <Link
                href="/apply"
                onClick={closeMobileMenu}
                className="block w-full p-3 text-center text-base font-semibold !text-white bg-blue-600 rounded-full no-underline hover:bg-blue-700 active:bg-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                style={{ color: 'white' }}
                role="menuitem"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
