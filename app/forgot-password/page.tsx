import { redirect } from 'next/navigation';

// /forgot-password redirects to the canonical password reset page
export default function ForgotPasswordPage() {
  redirect('/reset-password');
}
