'use client';

import { useState } from 'react';
import { Plus, Loader2, CheckCircle } from 'lucide-react';

interface IepCreateButtonProps {
  studentId: string;
  studentName: string;
  onCreated?: () => void;
}

export default function IepCreateButton({ studentId, studentName, onCreated }: IepCreateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    if (!confirm(`Create IEP for ${studentName}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/wioa/iep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (res.ok) {
        setCreated(true);
        onCreated?.();
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  if (created) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" /> IEP Created
      </span>
    );
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      Create IEP
    </button>
  );
}
