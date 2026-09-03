import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  className?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const baseClass = isLast || !item.href
          ? 'text-slate-900 font-medium'
          : 'text-slate-600 hover:text-slate-900 transition-colors';
        const className = `${baseClass} ${item.className ?? ''}`.trim();

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
            {isLast || !item.href ? (
              <span className={className} aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className={className}>
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};