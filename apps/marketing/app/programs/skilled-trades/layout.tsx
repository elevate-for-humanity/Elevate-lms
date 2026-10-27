import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Skilled Trades Training Programs',
  description:
    'Skilled trades training in Indianapolis with program-specific duration, credential, tuition, funding, and career-support disclosures.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/skilled-trades',
  },
  openGraph: {
    title: 'Skilled Trades Training Programs',
    description:
      'Explore Indianapolis skilled-trades training with program-specific tuition and funding disclosures.',
    url: 'https://www.elevateforhumanity.org/programs/skilled-trades',
  },
};

export default function SkilledTradesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
