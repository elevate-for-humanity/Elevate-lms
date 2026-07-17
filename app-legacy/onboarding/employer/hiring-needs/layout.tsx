import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hiring Needs Assessment',
  description: 'Tell us about your hiring needs to match with trained graduates.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
