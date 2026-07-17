'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface MarkPaidButtonProps {
  payoutId: string;
  amount: number;
  recipientName: string;
  onPaid?: () => void;
}

export default function MarkPaidButton({ payoutId, amount, recipientName, onPaid }: MarkPaidButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMarkPaid = async () => {
    if (!confirm(`Mark $${amount.toLocaleString()} as paid to ${recipientName}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketplace/payouts/${payoutId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });
      
      if (res.ok) {
        setSuccess(true);
        onPaid?.();
      }
    } catch (err) {
      console.error('Failed to mark as paid:', err);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" /> Paid
      </span>
    );
  }

  return (
    <button
      onClick={handleMarkPaid}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
      Mark Paid
    </button>
  );
}
