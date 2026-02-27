import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentorship Programs',
  description: 'Mentorship opportunities and career guidance.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
