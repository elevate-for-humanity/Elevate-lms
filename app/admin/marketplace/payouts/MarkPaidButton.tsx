'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MarkPaidButton({
  creatorId,
  amount,
}: {
  creatorId: string;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkPaid = async () => {
    const confirmed = confirm(
      `Mark $${(amount / 100).toFixed(2)} as paid to this creator?\n\nThis will update all unpaid sales for this creator.`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/payouts/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to mark as paid');
      }

      alert('Payout marked as paid successfully!');
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMarkPaid}
      disabled={loading}
      className="bg-brand-blue-600 text-white px-4 py-2 rounded hover:bg-brand-blue-700 disabled:opacity-50 text-sm"
    >
      {loading ? 'Processing...' : 'Mark as Paid'}
    </button>
  );
}
