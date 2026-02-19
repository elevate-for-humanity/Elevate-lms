import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Elevate Apps',
    default: 'Apps | Elevate for Humanity',
  },
  description: 'Access your purchased apps and tools from Elevate for Humanity.',
  robots: { index: false, follow: false },
};

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
