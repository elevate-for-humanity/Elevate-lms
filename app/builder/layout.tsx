import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Builder | Elevate for Humanity',
  description: 'Build and customize your learning experience with Elevate for Humanity.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/builder',
  },
};

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout excludes the main site header/footer
  return <>{children}</>;
}
