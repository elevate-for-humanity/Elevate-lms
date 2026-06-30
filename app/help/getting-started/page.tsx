import type { Metadata } from 'next';
import { Rocket } from 'lucide-react';
import { HelpCategoryPage } from '@/components/help/HelpCategoryPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Getting Started | Help Center',
  description:
    'New to Elevate? Learn how to enroll, set up your account, and start your first course.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/getting-started' },
  robots: { index: true, follow: true },
};

export default function HelpGettingStartedPage() {
  return (
    <HelpCategoryPage
      config={{
        categorySlug: 'getting-started',
        title: 'Getting Started',
        description:
          'New to Elevate? Learn how to enroll in a program, set up your account, and begin your training.',
        icon: <Rocket className="w-6 h-6" />,
        relatedCategories: [
          { label: 'Courses & Learning', href: '/help/courses' },
          { label: 'Account & Billing', href: '/help/account' },
          { label: 'Video Tutorials', href: '/help/tutorials' },
        ],
      }}
    />
  );
}
