import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Purchase License',
  description: 'Purchase training licenses and certifications.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
