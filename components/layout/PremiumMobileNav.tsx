'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight, ShoppingBag, GraduationCap, Users, Building2, Briefcase, Phone } from 'lucide-react';
import clsx from 'clsx';

const mainLinks = [
  { href: '/store', label: 'Store', icon: ShoppingBag },
  { href: '/programs', label: 'Programs', icon: GraduationCap },
  { href: '/lms', label: 'LMS Portal', icon: GraduationCap },
  { href: '/student-portal', label: 'Student Portal', icon: Users },
  { href: '/staff-portal', label: 'Staff Portal', icon: Users },
  { href: '/employer', label: 'Employer Portal', icon: Building2 },
  { href: '/admin', label: 'Admin Portal', icon: Briefcase },
  { href: '/license', label: 'License Platform', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: Phone },
];

export function PremiumMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-black hover:text-brand-orange-600 transition touch-manipulation"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 overflow-y-auto shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange-500 text-white text-xs font-black uppercase">
                    EFH
                  </div>
                  <span className="text-sm font-semibold text-black">
                    Menu
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-black hover:text-brand-orange-600 transition touch-manipulation"
                  aria-label="Close navigation menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {mainLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-medium transition touch-manipulation',
                        isActive
                          ? 'bg-brand-orange-50 text-brand-orange-600'
                          : 'text-black hover:bg-slate-50'
                      )}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </Link>
                  );
                })}
              </nav>

              {/* Footer CTAs */}
              <div className="p-6 border-t border-slate-200 space-y-3">
                <Link
                  href="/apply"
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-3 px-4 bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-center font-semibold rounded-lg transition"
                >
                  Apply Now
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-3 px-4 border border-slate-300 text-black text-center font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
