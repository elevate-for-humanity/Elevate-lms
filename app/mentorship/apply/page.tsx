import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Apply for Mentorship | {PLATFORM_DEFAULTS.orgName}',
  description: 'Apply to be matched with a mentor in your career field.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

// Redirect to main apply page - mentorship is part of career services
export default function MentorshipApplyPage() {
  redirect('/apply');
}
