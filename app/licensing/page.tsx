import { redirect } from 'next/navigation';

// Licensing is a platform concept, not a transaction
export default function LicensingRedirect() {
  redirect('/platform/licensing');
}
