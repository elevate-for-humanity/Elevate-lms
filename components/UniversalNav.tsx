'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavLink {
  label: string;
  href: string;
}

interface UniversalNavProps {
  links: NavLink[];
  ctaText?: string;
  ctaHref?: string;
  bgColor?: string;
  textColor?: string;
  logo?: string;
  logoHref?: string;
}

export default function UniversalNav({
  links,
  ctaText,
  ctaHref,
  bgColor = 'bg-blue-600',
  textColor = 'text-white',
  logo,
  logoHref = '/',
}: UniversalNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`${bgColor} ${textColor} sticky top-0 z-50 shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {logo && (
            <Link
              href={logoHref}
              className="font-bold text-xl hover:opacity-80 transition-opacity cursor-pointer"
            >
              {logo}
            </Link>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:opacity-80 transition-opacity cursor-pointer px-3 py-2"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          {ctaText && ctaHref && (
            <Link
              href={ctaHref}
              target={ctaHref.startsWith('http') ? '_blank' : undefined}
              className="hidden md:block bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {ctaText}
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 cursor-pointer hover:opacity-80"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:opacity-80 transition-opacity py-2 cursor-pointer px-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {ctaText && ctaHref && (
                <Link
                  href={ctaHref}
                  target={ctaHref.startsWith('http') ? '_blank' : undefined}
                  className="bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors text-center cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {ctaText}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
