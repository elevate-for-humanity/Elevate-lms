// Server Component - NO 'use client'
// Static desktop navigation links

import Link from 'next/link';

interface SubItem {
  name: string;
  href: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
}

interface NavItem {
  name: string;
  href?: string;
  subItems?: SubItem[];
}

export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  const isExternal = (href: string) => href?.startsWith('http');

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => (
        <div key={item.name} className="relative group">
          {item.href ? (
            <Link href={item.href} className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue-600">
              {item.name}
            </Link>
          ) : (
            <button className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue-600">
              {item.name}
            </button>
          )}

          {item.subItems && item.subItems.length > 0 && (
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-2 min-w-[200px]">
                {item.subItems.map((sub) => (
                  <Link 
                    key={(sub.href || '') + sub.name} 
                    href={sub.href || '#'} 
                    className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md"
                    {...(isExternal(sub.href || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
