import { redirect } from 'next/navigation';
import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'Enroll',
  description: 'Start enrollment for workforce training and credential pathways. Submit your application and get next steps for onboarding.',
  path: '/enroll',
});

export default function EnrollRedirect() {
  redirect('/apply/student');
}
