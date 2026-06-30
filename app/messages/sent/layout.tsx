import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Messages | Sent',
  description: `${PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/messages/sent',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
