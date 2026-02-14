"use client";

import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Award, User, Menu, X } from 'lucide-react';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/lms/dashboard', label: 'Dashboard', icon: Home },
    { href: '/lms/courses', label: 'Courses', icon: BookOpen },
    { href: '/lms/achievements', label: 'Achievements', icon: Award },
    { href: '/lms/profile', label: 'Profile', icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Link" className="text-xl font-bold text-brand-orange-600">
            Elevate
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <nav role="navigation" aria-label="Main navigation" className="px-4 py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                      isActive(item.href)
                        ? 'bg-brand-blue-50 text-brand-orange-600'
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      {/* Bottom Navigation Bar */}
      <nav role="navigation" aria-label="Main navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[64px] ${
                  active ? 'text-brand-orange-600' : 'text-black hover:text-black'
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span
                  className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Spacer for fixed bottom nav */}
      <div className="lg:hidden h-20" />
    </>
  );
}
