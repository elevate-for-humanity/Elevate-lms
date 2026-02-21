import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'Contact',
  description: 'Contact Elevate for Humanity to discuss training cohorts, partnerships, enrollment questions, and program alignment for workforce agencies.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
