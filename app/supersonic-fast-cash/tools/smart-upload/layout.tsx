import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Upload | Supersonic Fast Cash',
  description: 'Upload tax documents securely with Smart Upload.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
