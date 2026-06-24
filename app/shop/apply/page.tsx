import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Apply to Partner | {PLATFORM_DEFAULTS.orgName}',
  description: 'Apply to become a barbershop partner with {PLATFORM_DEFAULTS.orgName} apprenticeship program.',
};

export default function ShopApplyPage() {
  redirect('/partners/barbershop-apprenticeship/apply');
}
