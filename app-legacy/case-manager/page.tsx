import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function CaseManagerIndexPage() {
  redirect('/case-manager/dashboard');
}
