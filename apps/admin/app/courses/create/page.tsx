import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Course | Admin',
  robots: { index: false, follow: false },
};

export default function AdminCoursesCreatePage() {
  redirect('/curriculum');
}
