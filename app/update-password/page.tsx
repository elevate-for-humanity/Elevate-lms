// Orphaned duplicate of /auth/reset-password. Nothing links here.
// Supabase password-reset emails redirect to /auth/confirm?next=/auth/reset-password.
import { redirect } from 'next/navigation';

export default function UpdatePasswordPage() {
  redirect('/auth/reset-password');
}
