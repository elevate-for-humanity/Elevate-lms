import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'Welding Training Program',
  description: 'Welding pathway focused on employability — core welding concepts, safety, and structured training designed for workforce entry and advancement.',
  path: '/programs/welding',
});

export default function WeldingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
