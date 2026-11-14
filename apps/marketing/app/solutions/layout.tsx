import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solutions',
  description: 'Workforce development solutions for organizations.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
