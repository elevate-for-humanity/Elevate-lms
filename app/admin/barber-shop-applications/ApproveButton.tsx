'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function ApproveButton({ applicationId, status }: { applicationId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (status === 'approved') {
    return <span className="text-xs text-brand-green-600 font-medium">Approved</span>;
  }

  const handleApprove = async () => {
    if (!confirm('Approve this partner application? This will create their login account and send an invitation email.')) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/barber-shop-applications/${applicationId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Server error ${res.status}`);
      }

      if (data.success) {
        setResult('approved');
        router.refresh();
      } else {
        setResult(`error: ${data.error || 'Failed'}`);
      }
    } catch (err) {
      setResult(`error: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (result === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-brand-green-600 font-medium">
        <CheckCircle className="w-3 h-3" /> Approved
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-green-600 text-white text-xs font-medium rounded-lg hover:bg-brand-green-700 disabled:opacity-50 transition"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        Approve
      </button>
      {result && result.startsWith('error') && (
        <p className="text-xs text-brand-red-600 mt-1">{result}</p>
      )}
      {result && result.startsWith('partial') && (
        <p className="text-xs text-amber-600 mt-1">{result}</p>
      )}
    </div>
  );
}
