'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState } from 'react';

export default function TestFundingPage() {
  const [studentId, setStudentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/funding/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          programId,
          programSlug: 'barber-apprenticeship',
          fundingSource: 'WIOA',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      setResult({ err: 'Operation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Test Funding" }]} />
      </div>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Funding Checkout</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Student ID (UUID)
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Program ID (UUID)
            </label>
            <input
              type="text"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              placeholder="e.g., 65310ca8-c7a8-4633-ab9c-d25684090ecc"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-1">
              Barber Apprenticeship ID: 65310ca8-c7a8-4633-ab9c-d25684090ecc
            </p>
          </div>

          <button
            onClick={handleTest}
            disabled={loading || !studentId || !programId}
            className="w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:bg-slate-300 font-semibold"
          >
            {loading ? 'Creating Checkout...' : 'Create Test Checkout'}
          </button>

          {result && (
            <div className="mt-4 p-4 bg-slate-100 rounded-lg">
              <h3 className="font-bold mb-2">Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900 mb-2">How to Test:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Get a student UUID from your database</li>
            <li>Use program ID: 65310ca8-c7a8-4633-ab9c-d25684090ecc</li>
            <li>Click "Create Test Checkout"</li>
            <li>
              Complete payment in Stripe (use test card: 4242 4242 4242 4242)
            </li>
            <li>Check if enrollment activates automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
