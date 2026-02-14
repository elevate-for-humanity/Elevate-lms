"use client";
import { sanitizeHtml } from '@/lib/sanitize';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show on homepage
  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  });

  // Generate JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.label,
      'item': `https://www.elevateforhumanity.org${crumb.href}`,
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(JSON.stringify(structuredData)) }}
      />

      {/* Visual Breadcrumbs - pt accounts for fixed header */}
      <nav aria-label="Breadcrumb" className="bg-slate-50 border-b border-slate-200 pt-[56px] sm:pt-[70px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-slate-400 mx-2" />
                  )}
                  {isLast ? (
                    <span className="text-black font-semibold" aria-current="page">
                      {index === 0 ? <Home className="w-4 h-4" /> : crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-brand-blue-600 hover:text-brand-blue-800 hover:underline flex items-center"
                    >
                      {index === 0 ? <Home className="w-4 h-4" /> : crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
