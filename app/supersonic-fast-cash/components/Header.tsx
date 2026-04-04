'use client';

import Link from 'next/link';
import { Phone, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

/**
 * Professional Tax Brand Header
 * Red / White / Blue design system
 * Navigation: Home | Pricing | How It Works | Cash Advance | Support | Start Tax Prep
 */
export function SupersonicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/supersonic-fast-cash', label: 'Home' },
    { href: '/supersonic-fast-cash/pricing', label: 'Pricing' },
    { href: '/supersonic-fast-cash/how-it-works', label: 'How It Works' },
    { href: '/supersonic-fast-cash/cash-advance', label: 'Cash Advance' },
    { href: '/supersonic-fast-cash/support', label: 'Support' },
  ];

  return (
    <>
      {/* Top Bar - Trust indicators */}
      <div className="bg-brand-blue-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Secure Tax Preparation</span>
            </div>
            <a href="/support" className="flex items-center gap-2 hover:text-white">
              <Phone className="w-4 h-4" />
              <span>(317) 314-3757</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/supersonic-fast-cash" className="flex items-center">
              <div className="text-xl font-bold">
                <span className="text-brand-blue-900">Supersonic</span>
                <span className="text-brand-red-600"> Fast Cash</span>
                <span className="text-brand-blue-900 text-sm font-normal ml-1">LLC</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-brand-blue-900 font-medium text-sm"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/supersonic-fast-cash/start"
                className="px-5 py-2.5 bg-brand-red-600 text-white font-semibold rounded-lg hover:bg-brand-red-700 transition-colors text-sm"
              >
                Start Tax Prep
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-brand-blue-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <nav className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-gray-700 hover:text-brand-blue-900 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/supersonic-fast-cash/start"
                className="block w-full text-center px-5 py-3 bg-brand-red-600 text-white font-semibold rounded-lg hover:bg-brand-red-700 transition-colors mt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Tax Prep
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50">
        <Link
          href="/supersonic-fast-cash/start"
          className="block w-full text-center px-5 py-3 bg-brand-red-600 text-white font-semibold rounded-lg hover:bg-brand-red-700 transition-colors"
        >
          Start Tax Preparation
        </Link>
      </div>
    </>
  );
}
