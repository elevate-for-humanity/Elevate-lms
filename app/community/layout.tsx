import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { template: '%s | Community', default: 'Community | Elevate for Humanity' },
  description: 'Elevate for Humanity community hub.',
  robots: { index: false, follow: false },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
