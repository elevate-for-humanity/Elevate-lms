import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Certiport Exam Voucher',
  description:
    `Access your Certiport exam voucher for industry certification testing through ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/certiport-exam',
  },
  robots: { index: false },
};

export default function CertiportExamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
