import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Licensing',
  description: 'Platform licensing and enterprise access.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
