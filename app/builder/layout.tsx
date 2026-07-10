import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Builder',
  description: `Build and customize your learning experience with ${PLATFORM_DEFAULTS.orgName}.`,
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/builder',
  },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  // This layout excludes the main site header/footer
  return <>{children}</>;
}
