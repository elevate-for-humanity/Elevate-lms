import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Licensing',
  description: 'License the Elevate LMS platform for your organization.',
};


// Licensing is a platform concept, not a transaction
export default function LicensingRedirect() {
  redirect('/platform/licensing');
}
