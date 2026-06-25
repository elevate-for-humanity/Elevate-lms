import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'Course Catalog',
  description: 'Browse workforce training courses and credential pathways. Find the right program, timeline, and outcome-based training track.',
  path: '/courses/catalog',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
