import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Application',
  description: 'Track the status of your career training application.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
