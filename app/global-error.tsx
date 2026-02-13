'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture error with Sentry
    Sentry.captureException(error);
    
    // Log error to console for debugging
    console.error('=== GLOBAL ERROR CAUGHT ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error digest:', error.digest);
    console.error('========================');
    
    // Send to Sentry if configured
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          errorBoundary: 'global',
        },
      });
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            <div className="mb-8">
              <AlertTriangle className="h-20 w-20 text-red-600 mx-auto mb-6 animate-pulse" />
              
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                Critical Application Error
              </h1>
              
              <p className="text-lg text-black mb-6">
                We encountered a critical error that prevented the application from loading properly.
                Our team has been automatically notified and is working to resolve this issue.
              </p>

              {error.message && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-red-800 mb-2">Error Details:</p>
                  <p className="text-sm text-red-700 font-mono break-words">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </button>
              
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                <Home className="h-5 w-5" />
                Go to Homepage
              </a>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-black mb-2">
                Need immediate assistance?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                <a 
                  href="mailto:elevate4humanityedu@gmail.com" 
                  className="text-orange-600 hover:text-orange-700 font-semibold hover:underline"
                >
                  Email Support
                </a>
                <span className="hidden sm:inline text-gray-400">•</span>
                <a 
                  href="/support" 
                  className="text-orange-600 hover:text-orange-700 font-semibold hover:underline"
                >
                  Call Support
                </a>
              </div>
            </div>

            {error.digest && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Reference this error ID when contacting support: <span className="font-mono font-semibold">{error.digest}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

declare global {
  interface Window {
    Sentry?: any;
  }
}
