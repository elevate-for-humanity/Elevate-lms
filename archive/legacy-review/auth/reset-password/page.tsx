import { Metadata } from 'next';
import AdminResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password — Elevate Admin',
  robots: { index: false, follow: false },
};

export default function AdminResetPasswordPage() {
  return <AdminResetPasswordForm />;
}
