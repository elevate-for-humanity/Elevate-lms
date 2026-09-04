import { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password | Elevate for Humanity',
  description: 'Reset your password to access your student portal.',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string; mode?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordForm portal={params.portal} mode={params.mode} />;
}
