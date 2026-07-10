export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ForgotPasswordForm from './ForgotPasswordForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Forgot Password | Reset Your Account',
  description:
    `Reset your ${PLATFORM_DEFAULTS.orgName} account password. Enter your email to receive a password reset link.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/forgot-password' },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset your password</h1>
          <p className="text-sm text-slate-600 mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
