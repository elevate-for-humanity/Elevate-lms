'use client';

import { createClient } from '@/lib/supabase/client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  children?: NavItem[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  user?: any;
}

export function MobileMenu({ isOpen, onClose, items, user }: MobileMenuProps) {
  const pathname = usePathname();
  const menuRef = useFocusTrap(isOpen);
  const supabase = createClient();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Load user profile and notification count from DB
  useEffect(() => {
    async function loadUserData() {
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserProfile(profile);

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadNotifications(count || 0);
    }
    if (isOpen && user) loadUserData();
  }, [isOpen, user, supabase]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/20 z-[100000]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={menuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="md:hidden fixed right-0 top-0 bottom-0 w-72 bg-white z-[100001] overflow-y-auto shadow-xl focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            tabIndex={-1}
          >
            <div className="p-5 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="px-5 py-4" aria-label="Mobile navigation">
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`block py-3 text-base font-medium transition-colors ${
                        isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                {user ? (
                  <Link
                    href="/lms/dashboard"
                    onClick={onClose}
                    className="block w-full text-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/apply"
                    onClick={onClose}
                    className="block w-full text-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
