import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Training Programs | Elevate for Humanity',
  description: 'Career training programs in healthcare, skilled trades, and technology. Training at no cost to eligible Indiana residents through WIOA and state funding. Job placement support included.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs',
  },
};

export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
