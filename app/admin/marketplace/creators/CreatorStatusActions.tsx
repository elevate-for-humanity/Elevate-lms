'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

type CreatorStatus = 'active' | 'suspended' | 'pending_review' | 'inactive';

interface CreatorStatusActionsProps {
  creatorId: string;
  currentStatus: CreatorStatus;
  onStatusChange?: (newStatus: CreatorStatus) => void;
}

export default function CreatorStatusActions({ creatorId, currentStatus, onStatusChange }: CreatorStatusActionsProps) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: CreatorStatus) => {
    if (!confirm(`Change status to ${newStatus.replace('_', ' ')}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketplace/creators/${creatorId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        onStatusChange?.(newStatus);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: CreatorStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Suspended</span>;
      case 'pending_review':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">Inactive</span>;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge(currentStatus)}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : (
        <select
          value={currentStatus}
          onChange={(e) => updateStatus(e.target.value as CreatorStatus)}
          className="text-xs px-2 py-1 border border-slate-300 rounded"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_review">Pending Review</option>
          <option value="inactive">Inactive</option>
        </select>
      )}
    </div>
  );
}
