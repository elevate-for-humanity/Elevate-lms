import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { template: '%s | Hub', default: 'Hub | Elevate for Humanity' },
  description: 'Elevate for Humanity learning hub.',
  robots: { index: false, follow: false },
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
