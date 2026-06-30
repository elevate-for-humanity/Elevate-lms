import { Metadata } from 'next';
import Header from '@/components/site/Header';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Login',
  description:
    `Sign in to your ${PLATFORM_DEFAULTS.orgName} account to access your training programs and career services.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/login',
  },
  openGraph: {
    title: `Sign In | ${PLATFORM_DEFAULTS.orgName}`,
    description: `Sign in to access your training programs, career services, and workforce development tools.`,
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: `${PLATFORM_DEFAULTS.orgName} — Sign In` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Sign In | ${PLATFORM_DEFAULTS.orgName}`,
    description: `Sign in to access your training programs, career services, and workforce development tools.`,
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50">{children}</div>
    </>
  );
}
