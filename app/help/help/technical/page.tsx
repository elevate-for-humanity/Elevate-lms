import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { HelpCategoryPage } from '@/components/help/HelpCategoryPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Technical Support | Help Center',
  description:
    'Troubleshoot login issues, browser compatibility, video playback, and other technical problems.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/technical' },
  robots: { index: true, follow: true },
};

export default function HelpTechnicalPage() {
  return (
    <HelpCategoryPage
      config={{
        categorySlug: 'technical-support',
        title: 'Technical Support',
        description:
          'Troubleshoot login issues, browser compatibility, video playback, and platform errors.',
        icon: <Settings className="w-6 h-6" />,
        relatedCategories: [
          { label: 'Getting Started', href: '/help/getting-started' },
          { label: 'Courses & Learning', href: '/help/courses' },
          { label: 'Account & Billing', href: '/help/account' },
        ],
      }}
    />
  );
}
