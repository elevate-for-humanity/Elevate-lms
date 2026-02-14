'use client';

import { useState } from 'react';

const TEST_PROGRAMS = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Test Enrollment ($1)', cost: 1 },
  { id: 'bb4a45a1-2029-419a-8ed9-5f4cf167954b', name: 'Medical Assistant', cost: 504 },
  { id: 'e8bc1dbb-723a-4f4d-93bd-e07654280dc5', name: 'Forklift Operator', cost: 800 },
  { id: '7ceaca9d-71fa-449e-821b-012a16a6a503', name: 'CDL Training', cost: 4730 },
];

export default function TestEnrollmentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(TEST_PROGRAMS[0].id);
  const [fundingSource, setFundingSource] = useState('self_pay');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/programs/enroll/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: selectedProgram,
          funding_source: fundingSource,
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test Canonical Enrollment Checkout</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full border rounded p-2"
            >
              {TEST_PROGRAMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - ${p.cost}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Funding Source</label>
            <select
              value={fundingSource}
              onChange={(e) => setFundingSource(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="self_pay">Self Pay (full price)</option>
              <option value="workone">WorkOne (funded - $0)</option>
              <option value="wioa">WIOA (funded - $0)</option>
              <option value="grant">Grant (funded - $0)</option>
              <option value="employer">Employer (funded - $0)</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-brand-blue-600 text-white py-3 rounded font-medium hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating checkout...' : 'Start Checkout'}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            This page tests the canonical <code>/api/programs/enroll/checkout</code> endpoint.
            You must be logged in. After checkout, verify <code>student_enrollments</code> table.
          </p>
        </div>
      </div>
    </div>
  );
}
