import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers Training | Supersonic Fast Cash',
  description: 'Supersonic Fast Cash - Careers Training for tax preparation services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
