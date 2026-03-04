import React from 'react';
import { Metadata } from 'next';
// Image asset: /images/location-1.jpg

export const metadata: Metadata = {
  title: "Mobile App - Learn Anywhere | Elevate for Humanity",
  description: "Download our mobile app or install as a Progressive Web App (PWA) to access your courses offline and on the go.",
  keywords: ["mobile app", "PWA", "offline learning", "mobile learning", "app download"],
  openGraph: {
    title: "Mobile App - Learn Anywhere | Elevate for Humanity",
    description: "Access your courses offline and on the go with our mobile app.",
    images: ["/images/pages/comp-home-highlight-health.jpg"],
    type: "website",
  },
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
