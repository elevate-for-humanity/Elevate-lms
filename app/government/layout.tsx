import React from 'react';
import { Metadata } from 'next';
// Image asset: /images/pages/funding-impact-1.jpg

export const metadata: Metadata = {
  title: "Government & Workforce Boards - Partner Portal",
  description: "Access compliance data, contracts, and reporting for workforce boards and government partners. Track outcomes and program performance.",
  keywords: ["government portal", "workforce board", "compliance reporting", "WIOA compliance", "government contracts"],
  openGraph: {
    title: "Government & Workforce Boards Portal | Elevate for Humanity",
    description: "Access compliance data, contracts, and reporting for workforce boards and government partners.",
    images: ["/images/pages/comp-home-highlight-health.jpg"],
    type: "website",
  },
};

export default function GovernmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
