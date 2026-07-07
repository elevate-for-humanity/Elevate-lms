'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface CreatorApprovalActionsProps {
  creatorId: string;
  creatorName: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function CreatorApprovalActions({ creatorId, creatorName, onApprove, onReject }: CreatorApprovalActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    if (!confirm(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${creatorName}?`)) return;
    
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/marketplace/creators/${creatorId}/${action}`, {
        method: 'POST',
      });
      
      if (res.ok) {
        if (action === 'approve') onApprove?.();
        else onReject?.();
      }
    } catch (err) {
      console.error(`Failed to ${actionText}:`, err);
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
