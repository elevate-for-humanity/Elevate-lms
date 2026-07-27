import type { Metadata } from 'next';
import CredentialsClient from './CredentialsClient';

export const metadata: Metadata = {
  title: 'My Credentials | Elevate for Humanity',
  description: 'View and download your earned certifications and credentials.',
};

export default function CredentialsPage() {
  return <CredentialsClient />;
}
