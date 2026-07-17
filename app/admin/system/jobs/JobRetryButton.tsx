'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, Loader2 } from 'lucide-react';

interface JobRetryButtonProps {
  jobId: string;
  jobName?: string;
  onRetry?: () => void;
}

export default function JobRetryButton({ jobId, jobName, onRetry }: JobRetryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [retried, setRetried] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/system/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        setRetried(true);
        onRetry?.();
      }
    } catch (err) {
      console.error('Retry failed:', err);
    }
    setLoading(false);
  };

  if (retried) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" /> Queued
      </span>
    );
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      title={jobName ? `Retry ${jobName}` : 'Retry job'}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
      Retry
    </button>
  );
}
