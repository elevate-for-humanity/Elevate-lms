import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Verify Email | Elevate for Humanity',
};

export default function VerifyEmailPage() {
  redirect('/verify');
}
