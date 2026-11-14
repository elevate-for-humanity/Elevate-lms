'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  className?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  dark?: boolean;
}

export function Breadcrumbs({ items, className = '', dark = false }: BreadcrumbsProps) {
  const base = dark ? 'text-white/80' : 'text-slate-600';
  const separator = dark ? 'text-white/45' : 'text-slate-400';
  const current = dark ? 'text-white' : 'text-slate-900';
  const hover = dark ? 'hover:text-white' : 'hover:text-brand-blue-600';

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${base} ${className}`}>
      <ol className="flex items-center flex-wrap gap-1">
        <li className="flex items-center">
          <Link href="/" className={`${hover} transition-colors flex items-center gap-1`} aria-label="Home">
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            <ChevronRight className={`w-4 h-4 mx-1 ${separator}`} aria-hidden="true" />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className={`${item.className ?? ''} ${hover} transition-colors`}>
                {item.label}
              </Link>
            ) : (
              <span
                className={`${item.className ?? ''} ${index === items.length - 1 ? `${current} font-medium` : ''}`}
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function generateBreadcrumbs(pathname: string, customLabels?: Record<string, string>): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;
    currentPath += `/${segment}`;
    if (segment.startsWith('(') && segment.endsWith(')')) continue;
    const label = customLabels?.[segment] || segment.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    items.push({
      label,
      ...(i < segments.length - 1 ? { href: currentPath } : {}),
    });
  }
  return items;
}

export const PROGRAM_LABELS: Record<string, string> = {
  programs: 'Programs', healthcare: 'Healthcare', 'skilled-trades': 'Skilled Trades', technology: 'Technology', business: 'Business', barber: 'Barber Program', 'cosmetology-apprenticeship': 'Cosmetology Apprenticeship', 'esthetician-apprenticeship': 'Esthetician Apprenticeship', 'nail-technician-apprenticeship': 'Nail Technician Apprenticeship', 'cdl-transportation': 'CDL & Transportation', 'direct-support-professional': 'Direct Support Professional', 'drug-collector': 'Drug Collector', 'tax-entrepreneurship': 'Tax Entrepreneurship', jri: 'Justice-Involved Reentry', 'micro-programs': 'Micro Programs', apprenticeships: 'Apprenticeships',
};

export const LMS_LABELS: Record<string, string> = {
  lms: 'Learning Portal', dashboard: 'Dashboard', courses: 'My Programs', assignments: 'Assignments', grades: 'Grades', certificates: 'Certificates', progress: 'Progress', calendar: 'Calendar', messages: 'Messages', community: 'Community', forums: 'Forums', portfolio: 'Portfolio', badges: 'Badges', achievements: 'Achievements', leaderboard: 'Leaderboard', settings: 'Settings', profile: 'Profile',
};
