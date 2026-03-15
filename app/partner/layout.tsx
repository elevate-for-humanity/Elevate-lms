import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'Partner Portal | Elevate for Humanity',
    template: '%s | Partner Portal',
  },
  description: 'Manage your partnership with Elevate for Humanity.',
};

const navItems = [
  { href: '/partner', label: 'Overview' },
  { href: '/partner/login', label: 'Login' },
  { href: '/partner/documents', label: 'Documents' },
  { href: '/partner/reports', label: 'Reports' },
  { href: '/partner/settings', label: 'Settings' },
  { href: '/partner/courses/create', label: 'Create Course' },
  { href: '/partner/programs/barber', label: 'Barber Program' },
];

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/partner" className="text-lg font-bold text-brand-orange-600">Partner Portal</Link>
              <div className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-gray-600 hover:text-brand-blue-700">{item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
