import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'License Checkout | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function LicenseCheckoutLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!SLUG.test(slug) || slug.length > 200) notFound();

  return children;
}
