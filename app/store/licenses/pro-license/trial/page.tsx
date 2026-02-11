import { redirect } from 'next/navigation';

// Consolidate all trial requests to one page
export default function ProLicenseTrialRedirect() {
  redirect('/store/trial');
}
