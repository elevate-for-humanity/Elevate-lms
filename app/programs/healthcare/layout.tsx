import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs | Elevate for Humanity',
  description: 'Healthcare training programs including CNA certification ($1,200), Medical Assistant, Phlebotomy, and more. Funding assistance may be available through WIOA for eligible programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/healthcare',
  },
  openGraph: {
    title: 'Healthcare Training Programs | Elevate for Humanity',
    description: 'Start your healthcare career with affordable training programs in Indianapolis. CNA certification starting at $1,200.',
    url: 'https://www.elevateforhumanity.org/programs/healthcare',
  },
};

export default function HealthcareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
