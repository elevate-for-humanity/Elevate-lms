'use client';

import { createClient } from '@/lib/supabase/client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  subItems?: { name: string; href: string }[];
}

interface HeaderMobileMenuProps {
  items: NavItem[];
}

export default function HeaderMobileMenu({ items }: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const supabase = createClient();

  // Load user profile from DB when menu opens
  useEffect(() => {
    async function loadProfile() {
      if (!isOpen) return;
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
  }, [isOpen, supabase]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-slate-700 hover:text-slate-900"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
        className={`fixed top-[70px] right-0 bottom-0 w-full max-w-[300px] bg-white z-[9999] md:hidden transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="p-4" aria-label="Mobile navigation">
          {items.map((item) => (
            <div key={item.name} className="border-b border-slate-100">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
                    className="flex items-center justify-between w-full py-3 text-slate-900 font-medium"
                  >
                    {item.name}
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        expandedItem === item.name ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedItem === item.name && (
                    <div className="pb-3 pl-4">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => setIsOpen(false)}
                          className="block py-2 text-slate-600 hover:text-brand-blue-600"
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
                  onClick={() => setIsOpen(false)}
                  className="block py-3 text-slate-900 font-medium hover:text-brand-blue-600"
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}

          {/* Mobile CTAs */}
          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3 border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/inquiry"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3 border border-brand-blue-600 text-brand-blue-600 rounded-lg font-semibold"
            >
              Get Info
            </Link>
            <Link
              href="/programs"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3 bg-brand-blue-600 text-white rounded-lg font-semibold"
            >
              View Programs
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
