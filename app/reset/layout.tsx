import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Browser | Elevate For Humanity',
  description: 'Clear browser cache, cookies, and local storage for Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/reset',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
