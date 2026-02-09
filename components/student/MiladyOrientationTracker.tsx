"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useEffect, useState } from 'react';

export function MiladyOrientationTracker({
  userId,
  alreadyCompleted,
}: {
  userId: string;
  alreadyCompleted: boolean;
}) {
  const [marked, setMarked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (alreadyCompleted || marked) return;

    const markOrientation = async () => {
      try {
        // Direct DB update for Milady orientation completion
        const { error } = await supabase
          .from('milady_orientation_status')
          .upsert({
            user_id: userId,
            completed: true,
            completed_at: new Date().toISOString(),
            engagement_seconds: 3
          }, { onConflict: 'user_id' });

        if (!error) {
          // Also update the student's onboarding progress
          await supabase
            .from('student_onboarding')
            .update({ milady_orientation_complete: true })
            .eq('user_id', userId);

          // Log the completion event
          await supabase
            .from('onboarding_events')
            .insert({
              user_id: userId,
              event_type: 'milady_orientation_completed',
              timestamp: new Date().toISOString()
            });

          setMarked(true);
        }

        // Also call API as fallback
        await fetch('/api/student/mark-milady-orientation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch (error) { /* Error handled silently */ 
        // Error: $1
      }
    };

    // Mark after 3 seconds on page (proves engagement)
    const timer = setTimeout(markOrientation, 3000);
    return () => clearTimeout(timer);
  }, [userId, alreadyCompleted, marked, supabase]);

  return null;
}
