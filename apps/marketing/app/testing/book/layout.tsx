import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Your Exam',
  description: 'Schedule and book your professional certification exam at Elevate Testing Center.',
  robots: { index: false, follow: false },
};

export default function TestingBookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
