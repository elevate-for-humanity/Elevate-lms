import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workforce Board',
  description: 'Workforce board dashboard and reporting.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
