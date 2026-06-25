import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
  description: 'Credential verification and sharing.',
};

export default function CredentialsPage({ params }: { params: { token: string } }) {
  // Redirect to credential share page with token
  redirect(`/c/${params.token}`);
}
