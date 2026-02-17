'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState } from 'react';
import { XCircle } from 'lucide-react';

export default function TestWebhookPage() {
  const [studentId, setStudentId] = useState('');
  const [programId, setProgramId] = useState(
    '65310ca8-c7a8-4633-ab9c-d25684090ecc'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          programId,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setResult({ err: 'Operation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Test Webhook" }]} />
      </div>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Test Webhook (No Payment)</h1>
        <p className="text-black mb-8">
          Simulates automatic enrollment without going through Stripe
        </p>

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
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-1">
              Barber Apprenticeship (default)
            </p>
          </div>

          <button
            onClick={handleTest}
            disabled={loading || !studentId || !programId}
            className="w-full px-6 py-3 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 disabled:bg-slate-300 font-semibold"
          >
            {loading ? 'Testing...' : 'Test Auto-Enrollment (No Payment)'}
          </button>

          {result && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                result.success
                  ? 'bg-brand-green-50 border border-brand-green-200'
                  : 'bg-brand-red-50 border border-brand-red-200'
              }`}
            >
              <h3 className="font-bold mb-2">
                {result.success
                  ? '<span className="text-slate-400 flex-shrink-0">•</span> Success!'
                  : '<XCircle className="w-5 h-5 inline-block" /> Error'}
              </h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-brand-blue-900 mb-2">How This Works:</h3>
          <ul className="text-sm text-brand-blue-800 space-y-1 list-disc list-inside">
            <li>Simulates webhook without Stripe payment</li>
            <li>Creates or activates enrollment directly</li>
            <li>No payment required - instant test</li>
            <li>Check enrollments table to verify</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900 mb-2">Get Student ID:</h3>
          <p className="text-sm text-yellow-800 mb-2">
            Run this in Supabase SQL Editor:
          </p>
          <code className="block bg-yellow-100 p-2 rounded text-xs">
            SELECT id, email FROM profiles WHERE role = 'student' LIMIT 5;
          </code>
        </div>
      </div>
    </div>
  );
}
