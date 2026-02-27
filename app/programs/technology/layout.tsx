import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technology Training Programs | Elevate for Humanity',
  description: 'Free technology training including IT Support, Cybersecurity, and Web Development. WIOA-funded programs with job placement support in Indianapolis.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/technology',
  },
  openGraph: {
    title: 'Technology Training Programs | Elevate for Humanity',
    description: 'Start your tech career with training programs at no cost to eligible participants in Indianapolis.',
    url: 'https://www.elevateforhumanity.org/programs/technology',
  },
};

export default function TechnologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
