import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'Plumbing Technician Training Program',
  description: 'Plumbing technician pathway with practical skill building, job readiness support, and employer-aligned training designed for working adults.',
  path: '/programs/plumbing',
});

export default function PlumbingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
