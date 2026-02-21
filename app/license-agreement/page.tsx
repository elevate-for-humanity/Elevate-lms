import { redirect } from 'next/navigation';

// License agreement is the same as EULA
export default function LicenseAgreementRedirect() {
  redirect('/eula');
}
