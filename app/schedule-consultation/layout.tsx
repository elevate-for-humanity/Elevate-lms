import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule a Consultation | Elevate for Humanity',
  description: 'Book a free consultation to discuss training programs and funding options.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
