import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instructor Credentials | Admin',
  robots: { index: false, follow: false },
};

export default function AdminInstructorCredentialsPage() {
  redirect('/');
}
