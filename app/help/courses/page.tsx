import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { HelpCategoryPage } from '@/components/help/HelpCategoryPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Courses & Learning | Help Center',
  description:
    'Help articles for accessing courses, tracking progress, completing assignments, and earning credentials.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/courses' },
  robots: { index: true, follow: true },
};

export default function HelpCoursesPage() {
  return (
    <HelpCategoryPage
      config={{
        categorySlug: 'courses-learning',
        title: 'Courses & Learning',
        description:
          'Access your courses, track progress, submit assignments, and earn your credentials.',
        icon: <BookOpen className="w-6 h-6" />,
        relatedCategories: [
          { label: 'Getting Started', href: '/help/getting-started' },
          { label: 'Account & Billing', href: '/help/account' },
          { label: 'Video Tutorials', href: '/help/tutorials' },
        ],
      }}
    />
  );
}
