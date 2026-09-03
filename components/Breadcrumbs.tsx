'use client';
import { sanitizeHtml } from '@/lib/sanitize';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { label, href };
    }),
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${PLATFORM_DEFAULTS.siteUrl}${item.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(JSON.stringify(breadcrumbSchema)) }}
      />
      <nav aria-label="Breadcrumb" className="bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <ol className="flex items-center gap-2 text-xs text-black">
            {breadcrumbItems.map((item, index) => (
              <li key={item.href} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="font-semibold text-black" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-brand-orange-600 transition-colors flex items-center gap-1"
                  >
                    {index === 0 && <Home className="h-3 w-3" />}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}
