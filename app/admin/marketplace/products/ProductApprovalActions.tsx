"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductApprovalActions({
  productId,
}: {
  productId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm('Approve this product for sale?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) throw new Error('Failed to approve');

      router.refresh();
    } catch (error) { /* Error handled silently */ 
      alert('Failed to approve product');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, reason }),
      });

      if (!res.ok) throw new Error('Failed to reject');

      router.refresh();
    } catch (error) { /* Error handled silently */ 
      alert('Failed to reject product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="bg-brand-green-600 text-white px-4 py-2 rounded hover:bg-brand-green-700 disabled:opacity-50 text-sm"
      >
        Approve
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="bg-brand-orange-600 text-white px-4 py-2 rounded hover:bg-brand-orange-700 disabled:opacity-50 text-sm"
      >
        Reject
      </button>
    </div>
  );
}
