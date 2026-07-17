import { redirect } from 'next/navigation';

/** Canonical 14-day managed platform trial (license evaluation → /store/trial). */
export default function ProLicenseTrialPage() {
  redirect('/store/trial');
}
