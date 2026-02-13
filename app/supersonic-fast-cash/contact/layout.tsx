import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Supersonic Fast Cash',
  description: 'Supersonic Fast Cash - Contact for tax preparation services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
