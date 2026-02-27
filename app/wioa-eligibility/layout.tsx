import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WIOA Eligibility',
  description: 'Check your eligibility for WIOA-funded training programs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
