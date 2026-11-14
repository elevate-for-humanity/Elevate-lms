import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Attendance | Apprentice',
  description: 'Track your attendance.',
};

export default function ApprenticeAttendancePage() {
  redirect('/apprentice/hours');
}
