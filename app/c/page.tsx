import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Credentials | Elevate For Humanity',
  description: 'Credential verification and sharing.',
};

export default function CredentialsPage({ params }: { params: { token: string } }) {
  // Redirect to credential share page with token
  redirect(`/c/${params.token}`);
}
