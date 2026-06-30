import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply Now | Career Training',
  description:
    'Apply for career training programs in healthcare, skilled trades, technology, and business. Free training available for eligible participants through WIOA funding. Some programs are self-pay or employer-paid.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
  openGraph: {
    title: 'Apply Now | Free Career Training',
    description: 'Start your career journey with free training programs. Apply in 10 minutes.',
    url: 'https://www.elevateforhumanity.org/apply',
  },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
