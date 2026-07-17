import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Funding | Grant programs',
  description: `Browse WIOA, Workforce Ready Grant, and JRI-funded career training programs available through ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/grant-programs',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
