import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'Electrical Technician Training Program',
  description: 'Electrical technician pathway built for workforce readiness — hands-on learning, safety fundamentals, and employer-aligned skills.',
  path: '/programs/electrical',
});

export default function ElectricalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
