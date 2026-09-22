import type { Metadata } from 'next';
import { ProgramHolderPhone } from '@/components/program-holder/ProgramHolderPhone';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Phone | Program Holder',
  robots: { index: false },
};

export default function ProgramHolderPhonePage() {
  return <ProgramHolderPhone />;
}
