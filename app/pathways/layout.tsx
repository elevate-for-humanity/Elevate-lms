import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Pathways',
  description: 'Career pathway programs and progression routes.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
