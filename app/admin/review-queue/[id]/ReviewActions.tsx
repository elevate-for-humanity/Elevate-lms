'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, RefreshCw, Loader2 } from 'lucide-react';

interface ReviewActionsProps {
  item: any;
  extraction: any;
  transferHours: any;
  routingScores: any[];
  userId: string;
}

export function ReviewActions({
  item,
  extraction,
  transferHours,
  routingScores,
  userId,
}: ReviewActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Override fields
  const [approvedHours, setApprovedHours] = useState(
    transferHours?.total_hours?.toString() || extraction?.extracted?.total_hours?.toString() || ''
  );
  const [selectedShopId, setSelectedShopId] = useState(routingScores[0]?.shop_id || '');
  const [rejectReason, setRejectReason] = useState('');

  const handleAction = async (action: 'approve' | 'reject' | 'request_reupload') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/review-queue/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue_item_id: item.id,
          action,
          user_id: userId,
          // Override data
          approved_hours: action === 'approve' && item.queue_type === 'transcript_review' 
            ? parseFloat(approvedHours) 
            : undefined,
          selected_shop_id: action === 'approve' && item.queue_type === 'routing_review'
            ? selectedShopId
            : undefined,
          reject_reason: action === 'reject' ? rejectReason : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process action');
      }

      router.push('/admin/review-queue');
      router.refresh();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (item.status === 'resolved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <span className="font-medium">Resolved</span>
        </div>
        {item.resolution && (
          <p className="text-sm text-green-600 mt-2">{item.resolution}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Actions</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Transcript Review - Hours Override */}
      {item.queue_type === 'transcript_review' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Approved Transfer Hours
          </label>
          <input
            type="number"
            value={approvedHours}
            onChange={(e) => setApprovedHours(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Enter hours to approve"
          />
          <p className="text-xs text-gray-500 mt-1">
            Extracted: {extraction?.extracted?.total_hours || 'N/A'}
          </p>
        </div>
      )}

      {/* Routing Review - Shop Selection */}
      {item.queue_type === 'routing_review' && routingScores.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign to Shop
          </label>
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {routingScores.map((score: any) => (
              <option key={score.shop_id} value={score.shop_id}>
                {score.shops?.name} ({(score.total_score * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Approve Button */}
      <button
        onClick={() => handleAction('approve')}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-slate-400 flex-shrink-0">•</span>}
        Approve
      </button>

      {/* Reject Section */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rejection Reason
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          rows={2}
          placeholder="Required for rejection"
        />
        <button
          onClick={() => handleAction('reject')}
          disabled={loading || !rejectReason.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Reject
        </button>
      </div>

      {/* Request Reupload */}
      {(item.queue_type === 'document_review' || item.queue_type === 'transcript_review') && (
        <button
          onClick={() => handleAction('request_reupload')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Request Reupload
        </button>
      )}
    </div>
  );
}
