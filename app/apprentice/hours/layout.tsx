import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apprentice Hours',
  description: 'Track and log your apprenticeship hours.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
