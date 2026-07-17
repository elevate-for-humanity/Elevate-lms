import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule a Consultation',
  description: 'Book a free consultation to discuss training programs and funding options.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/schedule-consultation',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
