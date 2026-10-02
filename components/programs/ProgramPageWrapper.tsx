'use client';

import { ReactNode } from 'react';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';

interface ProgramPageWrapperProps {
  children: ReactNode;
  programName: string;
  category?: string;
  categoryHref?: string;
}

/**
 * Wrapper component for program pages that adds consistent breadcrumbs
 */
export function ProgramPageWrapper({
  children,
  programName,
  category,
  categoryHref,
}: ProgramPageWrapperProps) {
  const breadcrumbItems: BreadcrumbItem[] = [{ label: 'Programs', href: '/programs' }];

  if (category && categoryHref) {
    breadcrumbItems.push({ label: category, href: categoryHref });
  }

  breadcrumbItems.push({ label: programName });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      {children}

      <section className="border-t border-slate-200 bg-slate-50" aria-label="Deposit policy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-700">
            <strong>Non-Refundable Deposit Notice:</strong> All deposits are non-refundable. A deposit is an administrative enrollment fee used to process your application, enrollment, and onboarding into the selected program or apprenticeship. Once paid, the deposit will not be refunded, including if you decide not to begin or continue the program. By submitting a deposit, you acknowledge and agree that the deposit is non-refundable.
          </p>
        </div>
      </section>
    </div>
  );
}

// Category mappings for programs
export const PROGRAM_CATEGORIES: Record<string, { name: string; href: string }> = {
  // Healthcare
  cna: { name: 'Healthcare', href: '/programs/healthcare' },
  phlebotomy: { name: 'Healthcare', href: '/programs/healthcare' },
  'medical-assistant': { name: 'Healthcare', href: '/programs/healthcare' },
  'direct-support-professional': { name: 'Healthcare', href: '/programs/healthcare' },
  'drug-collector': { name: 'Healthcare', href: '/programs/healthcare' },

  // Skilled Trades
  barber: { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  'barber-apprenticeship': { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  'cosmetology-apprenticeship': { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  'esthetician-apprenticeship': { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  'nail-technician-apprenticeship': { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  hvac: { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  electrical: { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  plumbing: { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  welding: { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  cdl: { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  'cdl-transportation': { name: 'Skilled Trades', href: '/programs/skilled-trades' },

  // Technology
  cybersecurity: { name: 'Technology', href: '/programs/technology' },
  'it-support': { name: 'Technology', href: '/programs/technology' },
  'software-development': { name: 'Technology', href: '/programs/technology' },

  // Business
  'tax-preparation': { name: 'Business & Financial', href: '/programs/business-administration' },
  'tax-entrepreneurship': { name: 'Business & Financial', href: '/programs/business-administration' },
  bookkeeping: { name: 'Business & Financial', href: '/programs/business-administration' },
};
