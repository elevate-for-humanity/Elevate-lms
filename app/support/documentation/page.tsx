import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Documentation | {PLATFORM_DEFAULTS.orgName}',
  description: 'Platform documentation and help resources.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/help',
  },
};

// Redirect to help page
export default function DocumentationPage() {
  redirect('/help/articles');
}
