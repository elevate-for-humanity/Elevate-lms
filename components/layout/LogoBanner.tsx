'use client';

import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * LogoStamp - A subtle, fixed logo in the corner for brand recognition
 * Similar to how universities display their seal/logo on pages
 */
export function LogoStamp() {
  const pathname = usePathname();
  
  // Don't show on homepage (it has its own brand section)
  if (pathname === '/') return null;

  return (
    <Link 
      href="/"
      className="fixed bottom-6 left-6 z-40 group hidden md:flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
      aria-label="Elevate for Humanity - Go to homepage"
    >
      <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-xl shadow-lg border border-slate-200 p-2 group-hover:shadow-xl group-hover:scale-105 transition-all">
        <LogoImage
          alt="Elevate for Humanity"
          width={56}
          height={56}
          className="w-full h-full object-contain"
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors uppercase tracking-wide">
        Elevate
      </span>
    </Link>
  );
}

// Keep the old export name for backwards compatibility
export function LogoBanner() {
  return <LogoStamp />;
}
