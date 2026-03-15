import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Error | Elevate for Humanity',
  description: 'Something went wrong.',
};

const ERROR_MESSAGES: Record<string, string> = {
  'service-unavailable': 'This service is temporarily unavailable. Please try again later.',
  'unauthorized': 'You do not have permission to access this page.',
  'not-found': 'The page you are looking for does not exist.',
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const messageKey = params.message || '';
  const displayMessage = ERROR_MESSAGES[messageKey] || 'An unexpected error occurred. Please try again.';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-brand-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
          <p className="text-gray-600 mb-8">{displayMessage}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium"
            >
              Go Home
            </Link>
            <Link
              href="/support"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
