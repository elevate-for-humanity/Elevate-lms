'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function MarketplaceThankYouContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseData, setPurchaseData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    // Fetch purchase details
    fetch(`/api/marketplace/purchase-details?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPurchaseData(data);
        }
      })
      .catch(() => {
        setError('Failed to load purchase details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4" />
          <p className="text-black">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  if (error || !purchaseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-brand-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
          <p className="text-black mb-6">
            {error || 'Unable to retrieve purchase details'}
          </p>
          <Link
            href="/marketplace"
            className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Thank You" }]} />
      </div>
<div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center mb-6">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Purchase Complete!</h1>
          <p className="text-black mb-8">
            Thank you for your purchase. Check your email for download
            instructions.
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-lg mb-4">Purchase Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black">Product:</span>
                <span className="font-semibold">
                  {purchaseData.productTitle || 'Digital Product'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Creator:</span>
                <span className="font-semibold">
                  {purchaseData.creatorName || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Amount:</span>
                <span className="font-semibold">
                  ${((purchaseData.amount || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Email:</span>
                <span className="font-semibold">
                  {purchaseData.email || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {purchaseData.downloadUrl && (
            <a
              href={purchaseData.downloadUrl}
              className="inline-block bg-brand-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition mb-4"
            >
              Download Now
            </a>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Important Information:
            </h3>
            <ul className="space-y-1 text-yellow-800">
              <li>• Download link sent to your email</li>
              <li>• Link expires in 30 days</li>
              <li>• Save your confirmation email</li>
              <li>• Contact creator for product support</li>
            </ul>
          </div>
        </div>

        <div className="text-center space-y-3">
          <Link
            href="/marketplace"
            className="block w-full bg-gray-100 text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Browse More Products
          </Link>
          <Link
            href="/"
            className="block w-full border border-gray-300 text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto" />
            <p className="mt-4 text-black">Loading...</p>
          </div>
        </div>
      }
    >
      <MarketplaceThankYouContent />
    </Suspense>
  );
}
