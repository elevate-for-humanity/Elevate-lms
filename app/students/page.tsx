import { redirect } from 'next/navigation';

export default function StudentsRedirect() {
  redirect('/lms/dashboard');
}
