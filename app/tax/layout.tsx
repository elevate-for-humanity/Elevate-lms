import type { Metadata } from 'next';
import SupersonicNav from '@/components/supersonic/SupersonicNav';
import SupersonicFooter from '@/components/supersonic/SupersonicFooter';

export const metadata: Metadata = {
  title: {
    default: 'Tax Services | Supersonic Fast Cash & Rise Up Foundation',
    template: '%s | Supersonic Fast Cash',
  },
  description: 'Free VITA tax preparation and professional tax services through Supersonic Fast Cash and Rise Up Foundation.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/tax' },
};

export default function TaxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-white overflow-y-auto">
      <SupersonicNav />
      <main>{children}</main>
      <SupersonicFooter />
    </div>
  );
}
