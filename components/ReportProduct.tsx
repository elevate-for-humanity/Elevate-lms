"use client";

import React from 'react';

import { useState } from 'react';

export function ReportProduct({ productId }: { productId: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');

  const send = async () => {
    if (!reason) {
      alert('Please select a reason');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          reporter_email: email,
          reason,
          details,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setSent(true);
      setShowForm(false);
    } catch (data: any) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-sm text-green-600">
        • Report submitted. Thank you.
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-sm text-black hover:text-black underline"
      >
        Report this product
      </button>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 mt-4">
      <h3 className="font-semibold mb-3">Report Product</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Reason *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select a reason</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="copyright">Copyright violation</option>
            <option value="misleading">Misleading description</option>
            <option value="spam">Spam or scam</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={3}
            placeholder="Additional information (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Your Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="For follow-up if needed"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={send}
            disabled={loading}
            className="bg-brand-orange-600 text-white px-4 py-2 rounded hover:bg-brand-orange-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
