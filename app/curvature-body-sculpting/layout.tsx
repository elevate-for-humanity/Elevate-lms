import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Curvature Body Sculpting | Body Contouring & Wellness Products',
  description: 'Professional body sculpting services and mental health wellness products. Non-invasive body contouring, skin treatments, and holistic wellness solutions.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/curvature-body-sculpting',
  },
  openGraph: {
    title: 'Curvature Body Sculpting - Body Contouring & Wellness',
    description: 'Professional body sculpting services and mental health wellness products.',
    url: 'https://www.elevateforhumanity.org/curvature-body-sculpting',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Curvature Body Sculpting' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Curvature Body Sculpting - Body Contouring & Wellness',
    description: 'Professional body sculpting services and mental health wellness products.',
    images: ['/og-default.jpg'],
  },
};

export default function CurvatureBodySculptingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
