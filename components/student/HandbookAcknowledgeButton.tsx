"use client";

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HandbookAcknowledgeButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/compliance/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'handbook_acknowledgment', handbookVersion: '1.0' }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        router.refresh();
      } else {
        alert('Failed to acknowledge handbook. Please try again.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAcknowledge}
      disabled={loading}
      className="px-6 py-3 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {loading ? 'Processing...' : 'I Acknowledge'}
    </button>
  );
}
