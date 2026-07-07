import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Schedule | LMS',
  description: 'View your learning schedule.',
};

export default function LmsSchedulePage() {
  redirect('/lms/courses');
}
