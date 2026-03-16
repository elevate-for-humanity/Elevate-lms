import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Documents | Elevate for Humanity',
  description: 'Upload required enrollment documents for your Elevate for Humanity program application.',
  robots: {
    // Authenticated form page — no value in Google indexing this
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Upload Documents | Elevate for Humanity',
    description: 'Upload required enrollment documents for your program application.',
    url: 'https://www.elevateforhumanity.org/documents/upload',
    siteName: 'Elevate for Humanity',
    images: [
      {
        url: '/images/pages/about-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Elevate for Humanity — document upload',
      },
    ],
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
