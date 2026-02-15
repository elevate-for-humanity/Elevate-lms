// Server Component - NO 'use client'
// Static desktop navigation links

import Link from 'next/link';

interface SubItem {
  name: string;
  href: string;
  isHeader?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  subItems?: SubItem[];
}

interface HeaderDesktopNavProps {
  items: NavItem[];
}

export default function HeaderDesktopNav({ items }: HeaderDesktopNavProps) {
  return (
    <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
      {items.map((item) => (
        <div key={item.name} className="relative group">
          <Link
            href={item.href}
            className="text-slate-700 hover:text-brand-blue-600 font-medium text-sm transition-colors py-2"
            aria-haspopup={item.subItems && item.subItems.length > 0 ? 'true' : undefined}
          >
            {item.name}
          </Link>
          
          {/* Dropdown - CSS-only hover, no JS needed */}
          {item.subItems && item.subItems.length > 0 && (
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 py-2 min-w-[220px] max-h-[70vh] overflow-y-auto">
                {item.subItems.map((subItem) => (
                  subItem.isHeader ? (
                    <div
                      key={subItem.name}
                      className="px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wide bg-slate-50 mt-1 first:mt-0"
                    >
                      {subItem.name.replace(/—/g, '').trim()}
                    </div>
                  ) : (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue-600"
                    >
                      {subItem.name}
                    </Link>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
