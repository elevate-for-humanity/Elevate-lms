'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected' | string;

interface ApproveButtonProps {
  applicationId: string;
  status: Status;
}

export default function ApproveButton({ applicationId, status }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/barber-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) setCurrentStatus('approved');
    } catch (err) {
      console.error('Approve failed:', err);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/barber-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (res.ok) setCurrentStatus('rejected');
    } catch (err) {
      console.error('Reject failed:', err);
    }
    setLoading(false);
  };

  if (currentStatus === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium px-4 py-2">
        <CheckCircle className="w-4 h-4" />
        Approved
      </span>
    );
  }

  if (currentStatus === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-red-600 font-medium px-4 py-2">
        <XCircle className="w-4 h-4" />
        Rejected
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Approve
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
        Reject
      </button>
    </div>
  );
}
