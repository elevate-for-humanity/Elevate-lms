import { Metadata } from 'next';
import SupersonicNav from '@/components/supersonic/SupersonicNav';
import SupersonicFooter from '@/components/supersonic/SupersonicFooter';

export const metadata: Metadata = {
  title: {
    default: 'Supersonic Fast Cash | Tax Preparation & Refund Advance',
    template: '%s | Supersonic Fast Cash',
  },
  description:
    'Professional tax preparation, same-day refund advances up to $7,500, DIY filing, audit protection, bookkeeping, and payroll. PTIN-credentialed preparers. Indianapolis, IN.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com' },
  openGraph: {
    title: 'Supersonic Fast Cash — Get Your Refund Today',
    description: 'Professional tax prep and same-day refund advances up to $7,500.',
    url: 'https://www.supersonicfastermoney.com',
    siteName: 'Supersonic Fast Cash',
    images: [{ url: '/images/pages/tax-main-hero.jpg', width: 1200, height: 630, alt: 'Supersonic Fast Cash' }],
    type: 'website',
  },
};

export default function SupersonicFastCashLayout({ children }: { children: React.ReactNode }) {
  return (
    // z-[10000] beats the main site header at z-[9999]
    // fixed inset-0 + overflow-y-auto creates a full-viewport scroll container
    <div className="fixed inset-0 z-[10000] bg-white overflow-y-auto">
      <SupersonicNav />
      <main>{children}</main>
      <SupersonicFooter />
    </div>
  );
}
