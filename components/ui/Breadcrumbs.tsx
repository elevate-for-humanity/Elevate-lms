'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center text-sm text-slate-600 ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {/* Home link */}
        <li className="flex items-center">
          <Link 
            href="/" 
            className="hover:text-brand-blue-600 transition-colors flex items-center gap-1"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-1 text-slate-400" aria-hidden="true" />
            {item.href && index < items.length - 1 ? (
              <Link 
                href={item.href} 
                className="hover:text-brand-blue-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={index === items.length - 1 ? 'text-slate-900 font-medium' : ''}
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

/**
 * Generate breadcrumb items from a path
 */
export function generateBreadcrumbs(pathname: string, customLabels?: Record<string, string>): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Skip route groups like (app), (public), etc.
    if (segment.startsWith('(') && segment.endsWith(')')) continue;
    
    // Get label from custom labels or format the segment
    const label = customLabels?.[segment] || 
      segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    items.push({
      label,
      href: i < segments.length - 1 ? currentPath : undefined,
    });
  }
  
  return items;
}

// Common label mappings
export const PROGRAM_LABELS: Record<string, string> = {
  'programs': 'Programs',
  'healthcare': 'Healthcare',
  'skilled-trades': 'Skilled Trades',
  'technology': 'Technology',
  'business': 'Business',
  'barber': 'Barber Program',
  'cosmetology-apprenticeship': 'Cosmetology Apprenticeship',
  'esthetician-apprenticeship': 'Esthetician Apprenticeship',
  'nail-technician-apprenticeship': 'Nail Technician Apprenticeship',
  'cdl-transportation': 'CDL & Transportation',
  'direct-support-professional': 'Direct Support Professional',
  'drug-collector': 'Drug Collector',
  'tax-preparation': 'Tax Preparation',
  'tax-entrepreneurship': 'Tax Entrepreneurship',
  'jri': 'Justice-Involved Reentry',
  'micro-programs': 'Micro Programs',
  'apprenticeships': 'Apprenticeships',
};

export const LMS_LABELS: Record<string, string> = {
  'lms': 'Learning Portal',
  'dashboard': 'Dashboard',
  'courses': 'My Courses',
  'assignments': 'Assignments',
  'grades': 'Grades',
  'certificates': 'Certificates',
  'progress': 'Progress',
  'calendar': 'Calendar',
  'messages': 'Messages',
  'community': 'Community',
  'forums': 'Forums',
  'portfolio': 'Portfolio',
  'badges': 'Badges',
  'achievements': 'Achievements',
  'leaderboard': 'Leaderboard',
  'settings': 'Settings',
  'profile': 'Profile',
};
