import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculator | Supersonic Fast Cash',
  description: 'Supersonic Fast Cash - Calculator for tax preparation services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
