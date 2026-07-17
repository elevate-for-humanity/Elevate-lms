'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ReferralConfirmButtonProps {
  referralId: string;
  referrerName: string;
  refereeName: string;
  rewardAmount?: number;
  onConfirmed?: () => void;
}

export default function ReferralConfirmButton({ 
  referralId, 
  referrerName, 
  refereeName, 
  rewardAmount,
  onConfirmed 
}: ReferralConfirmButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    const message = rewardAmount 
      ? `Confirm referral: ${referrerName} referred ${refereeName}. Award $${rewardAmount}?`
      : `Confirm referral: ${referrerName} referred ${refereeName}?`;
      
    if (!confirm(message)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals/${referralId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId }),
      });
      if (res.ok) {
        setConfirmed(true);
        onConfirmed?.();
      }
    } catch (err) {
      console.error('Failed to confirm:', err);
    }
    setLoading(false);
  };

  if (confirmed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" /> Confirmed
      </span>
    );
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
      Confirm
    </button>
  );
}
