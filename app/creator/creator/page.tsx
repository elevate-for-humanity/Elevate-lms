import { redirect } from 'next/navigation';

import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Creator | {PLATFORM_DEFAULTS.orgName}',
  description: '{PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/creator',
  },
};
export default function CreatorPage() {
  redirect('/creator/dashboard');
}
