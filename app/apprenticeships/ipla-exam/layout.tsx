import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'IPLA Exam Scheduling',
  description: 'Schedule your Indiana Professional Licensing Agency exam for barber, cosmetology, and esthetics apprenticeships. $105 total fee.',
  path: '/apprenticeships/ipla-exam',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
