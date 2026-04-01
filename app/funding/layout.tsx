import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Funding Options | Free Career Training | Elevate For Humanity',
  description: 'Explore funding options for career training including WIOA, Job Ready Indy, and state programs. Most adults qualify for Funded training.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding',
  },
  openGraph: {
    title: 'Funding Options for Free Career Training',
    description: 'WIOA, Job Ready Indy, and state funding programs. Most adults qualify for Funded training.',
    url: 'https://www.elevateforhumanity.org/funding',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Career Training Funding' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funding Options for Free Career Training',
    description: 'WIOA, Job Ready Indy, and state funding programs for free career training.',
    images: ['/og-default.jpg'],
  },
};

export default function FundingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
