'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface WorkOneApproveButtonProps {
  requestId: string;
  participantName: string;
  onApproved?: () => void;
}

export default function WorkOneApproveButton({ requestId, participantName, onApproved }: WorkOneApproveButtonProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} WorkOne referral for ${participantName}?`)) return;
    
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/workone-queue/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        onApproved?.();
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(null);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Approve
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
        Reject
      </button>
    </div>
  );
}
