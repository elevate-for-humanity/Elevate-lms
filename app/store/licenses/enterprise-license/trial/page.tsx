import { redirect } from 'next/navigation';

/** Canonical 14-day managed platform trial (license evaluation → /store/trial). */
export default function EnterpriseLicenseTrialPage() {
  redirect('/store/trial');
}
