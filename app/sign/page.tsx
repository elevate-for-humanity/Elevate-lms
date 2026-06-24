import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign Document | Elevate For Humanity',
  description: 'Sign documents electronically.',
};

export default function SignPage({ params }: { params: { documentId: string } }) {
  // Dynamic route - redirect to specific document
  redirect(`/sign/${params.documentId}`);
}
