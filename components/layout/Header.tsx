'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[70px] bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Elevate for Humanity"
            width={40}
            height={40}
            className="w-10 h-10"
            priority
          />
          <span className="font-bold text-xl text-gray-900">Elevate</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link href="/programs" className="text-gray-700 hover:text-brand-blue-600 text-sm font-medium">
            Programs
          </Link>
          <Link href="/how-it-works" className="text-gray-700 hover:text-brand-blue-600 text-sm font-medium hidden sm:block">
            How It Works
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-brand-blue-600 text-sm font-medium hidden sm:block">
            Contact
          </Link>
          <Link
            href="/apply"
            className="bg-brand-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-blue-700"
          >
            Apply Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
