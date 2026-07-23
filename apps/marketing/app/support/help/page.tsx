import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get help with your Elevate account, courses, and training programs.',
  robots: {
    index: false, // /support is the canonical help page
    follow: true,
  },
};

// This page is deprecated. Users should be directed to /support.
// Keeping the page with a redirect for existing direct links.
export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-lg mx-auto px-4 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="text-3xl font-bold mb-4">Redirecting to Help Center...</h1>
          <p className="text-blue-200 mb-8">
            You&apos;ll be redirected to our full Help Center momentarily.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Help Center
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
          {/* Auto-redirect after 3 seconds */}
          <meta httpEquiv="refresh" content="3;url=/support" />
        </div>
      </section>
    </div>
  );
}
