import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function WebsiteBuilderStartTrialPage() {
  redirect('/store/trial?product=website-builder');
}
