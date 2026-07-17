'use client';

import { useState } from 'react';
import { DollarSign, CheckCircle, Loader2 } from 'lucide-react';

interface ApprovePayButtonProps {
  payoutId: string;
  amount: number;
  recipientName: string;
  onApproved?: () => void;
}

export default function ApprovePayButton({ payoutId, amount, recipientName, onApproved }: ApprovePayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`Approve payout of $${amount.toLocaleString()} to ${recipientName}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payout-queue/${payoutId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });
      if (res.ok) {
        setApproved(true);
        onApproved?.();
      }
    } catch (err) {
      console.error('Failed to approve:', err);
    }
    setLoading(false);
  };

  if (approved) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" /> Approved
      </span>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
      Approve Pay
    </button>
  );
}
