'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';


interface NavItem {
  name: string;
  href?: string;
  subItems?: { name: string; href: string; isHeader?: boolean; nested?: boolean }[];
}

interface HeaderMobileMenuProps {
  items: NavItem[];
}

export default function HeaderMobileMenu({ items }: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const pathname = usePathname();

  // Close menu on any route change
  useEffect(() => {
    setIsOpen(false);
    setExpandedItem(null);
  }, [pathname]);

  // Lock body scroll when menu is open and close on Escape
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Load user profile from DB when menu opens
  useEffect(() => {
    async function loadProfile() {
      if (!isOpen) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, role')
          .eq('id', user.id)
          .single();
        if (data) setUserProfile(data);
      }
    }
    loadProfile();
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button — hidden on desktop (lg+), visible on mobile and tablet */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-3 text-slate-700 hover:text-slate-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <span className="text-2xl leading-none" aria-hidden="true">&times;</span> : <span className="text-2xl leading-none" aria-hidden="true">&#9776;</span>}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className="fixed top-[70px] right-0 bottom-0 w-[85vw] max-w-[320px] bg-white z-[9999] md:hidden transform transition-transform duration-300 overflow-y-auto"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <nav className="p-4" aria-label="Mobile navigation">
          {items.map((item) => (
            <div key={item.name} className="border-b border-slate-100">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
                    className="flex items-center justify-between w-full py-3 text-slate-900 font-medium"
                    aria-expanded={expandedItem === item.name}
                  >
                    {item.name}
                    <span
                      className={`text-sm leading-none transition-transform inline-block ${
                        expandedItem === item.name ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    >&#9660;</span>
                  </button>
                  {expandedItem === item.name && (
                    <div className="pb-3 pl-4">
                      {item.subItems.map((subItem) => (
                        subItem.isHeader ? (
                          <div
                            key={subItem.name}
                            className="pt-3 pb-1 text-xs font-extrabold text-brand-red-600 uppercase tracking-wide border-l-3 border-brand-red-500 pl-2"
                          >
                            {subItem.name.replace(/—/g, '').trim()}
                          </div>
                        ) : (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsOpen(false)}
                            className={`block hover:text-brand-blue-600 ${
                              subItem.nested
                                ? 'py-1.5 pl-4 text-xs text-slate-400 border-l border-slate-200'
                                : 'py-3 text-slate-600'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </>
              ) : item.href ? (
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 text-slate-900 font-medium hover:text-brand-blue-600"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="block py-3 text-slate-900 font-medium">{item.name}</span>
              )}
            </div>
          ))}

          {/* Mobile CTAs */}
          <div className="mt-6 space-y-3">
            <Link
              href="/portals"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3 border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/start"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3 bg-brand-red-600 text-white rounded-lg font-semibold"
            >
              Check Eligibility
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
