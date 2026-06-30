import type { Metadata } from 'next';
import { CreditCard } from 'lucide-react';
import { HelpCategoryPage } from '@/components/help/HelpCategoryPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Account & Billing | Help Center',
  description:
    'Help articles for managing your Elevate account, billing, payments, and WIOA funding.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/account' },
  robots: { index: true, follow: true },
};

export default function HelpAccountPage() {
  return (
    <HelpCategoryPage
      config={{
        categorySlug: 'account-billing',
        title: 'Account & Billing',
        description:
          'Manage your account settings, payment methods, WIOA funding, and billing questions.',
        icon: <CreditCard className="w-6 h-6" />,
        relatedCategories: [
          { label: 'Getting Started', href: '/help/getting-started' },
          { label: 'Courses & Learning', href: '/help/courses' },
          { label: 'Technical Support', href: '/help/technical' },
        ],
      }}
    />
  );
}
