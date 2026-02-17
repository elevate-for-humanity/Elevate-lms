"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HandbookAcknowledgeButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      // Direct DB insert for handbook acknowledgment
      const { error: dbError } = await supabase
        .from('handbook_acknowledgments')
        .upsert({
          user_id: userId,
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          ip_address: null, // Set server-side
          user_agent: navigator.userAgent
        }, { onConflict: 'user_id' });

      if (!dbError) {
        // Update student onboarding status
        await supabase
          .from('student_onboarding')
          .update({ handbook_acknowledged: true })
          .eq('user_id', userId);

        // Log the event
        await supabase
          .from('compliance_events')
          .insert({
            user_id: userId,
            event_type: 'handbook_acknowledged',
            timestamp: new Date().toISOString()
          });
      }

      // Also call API as fallback
      const response = await fetch('/api/student/acknowledge-handbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok || !dbError) {
        router.refresh();
      } else {
        alert('Failed to acknowledge handbook. Please try again.');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
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
      <span className="text-slate-400 flex-shrink-0">•</span>
      {loading ? 'Processing...' : 'I Acknowledge'}
    </button>
  );
}
