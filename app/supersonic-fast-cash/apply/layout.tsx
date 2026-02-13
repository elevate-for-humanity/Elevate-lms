import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply for Tax Services | Supersonic Fast Cash',
  description: 'Apply for professional tax preparation and refund advance services. Get up to $7,500 same day with 0% interest.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/apply',
  },
  openGraph: {
    title: 'Apply for Tax Services | Supersonic Fast Cash',
    description: 'Apply for professional tax preparation and refund advance services.',
    url: 'https://www.elevateforhumanity.org/supersonic-fast-cash/apply',
  },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
