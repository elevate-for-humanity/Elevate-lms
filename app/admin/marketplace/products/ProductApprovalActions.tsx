'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface ProductApprovalActionsProps {
  productId: string;
  productName: string;
  currentStatus: 'pending' | 'approved' | 'rejected';
  onStatusChange?: (newStatus: 'approved' | 'rejected') => void;
}

export default function ProductApprovalActions({ productId, currentStatus, productName, onStatusChange }: ProductApprovalActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} "${productName}"?`)) return;
    
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/marketplace/products/${productId}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        onStatusChange?.(action === 'approve' ? 'approved' : 'rejected');
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(null);
  };

  if (currentStatus !== 'pending') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
        currentStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {currentStatus === 'approved' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {currentStatus}
      </span>
    );
  }

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
