'use client';

import React from 'react';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface AttendanceTrackerProps {
  courseId?: number;
  activityType?: string;
}

/**
 * AttendanceTracker - Tracks student session time and activity
 *
 * Features:
 * - Automatic session start on mount
 * - Activity detection (mouse, keyboard, scroll, touch)
 * - Inactivity timeout (5 minutes)
 * - Session duration tracking
 * - Weekly contact hours aggregation
 * - Automatic session end on unmount
 */
export default function AttendanceTracker({
  courseId,
  activityType = 'learning',
}: AttendanceTrackerProps) {
  const sessionIdRef = useRef<number | null>(null);
  const loginTimeRef = useRef<Date>(new Date());
  const lastActivityRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const supabase = useMemo(() => createBrowserClient(), []);

  // Start attendance session
  const startSession = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('attendance_log')
        .insert({
          student_id: user.id,
          course_id: courseId,
          login_time: new Date().toISOString(),
          activity_type: activityType,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        sessionIdRef.current = data.id;
        loginTimeRef.current = new Date();
        lastActivityRef.current = new Date();
      }
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }, [supabase, courseId, activityType]);

  // Update session duration
  const updateSession = useCallback(async () => {
    if (!sessionIdRef.current || !isActiveRef.current) return;

    try {
      const now = new Date();
      const durationMinutes = Math.round((now.getTime() - loginTimeRef.current.getTime()) / 60000);

      await supabase
        .from('attendance_log')
        .update({
          logout_time: now.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', sessionIdRef.current);
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }, [supabase]);

  // Update weekly contact hours aggregate
  const updateWeeklyHours = useCallback(
    async (userId: string, minutesToAdd: number) => {
      try {
        // Get start of current week (Sunday)
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        // Check if record exists for this week
        const { data: existing } = await supabase
          .from('contact_hours')
          .select('*')
          .eq('student_id', userId)
          .eq('week_start', weekStart.toISOString().split('T')[0])
          .single();

        const hoursToAdd = Math.round((minutesToAdd / 60) * 10) / 10;

        if (existing) {
          // Update existing record
          await supabase
            .from('contact_hours')
            .update({
              total_hours: existing.total_hours + hoursToAdd,
              sessions_count: existing.sessions_count + 1,
            })
            .eq('id', existing.id);
        } else {
          // Create new record
          await supabase.from('contact_hours').insert({
            student_id: userId,
            week_start: weekStart.toISOString().split('T')[0],
            total_hours: hoursToAdd,
            sessions_count: 1,
          });
        }
      } catch (error) {
        /* Error handled silently */
        // Error: $1
      }
    },
    [supabase],
  );

  // End session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      const now = new Date();
      const durationMinutes = Math.round((now.getTime() - loginTimeRef.current.getTime()) / 60000);

      await supabase
        .from('attendance_log')
        .update({
          logout_time: now.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', sessionIdRef.current);

      // Update weekly contact hours
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await updateWeeklyHours(user.id, durationMinutes);
      }
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }, [supabase, updateWeeklyHours]);

  // Track user activity
  const handleActivity = useCallback(() => {
    lastActivityRef.current = new Date();
    if (!isActiveRef.current) {
      isActiveRef.current = true;
    }
  }, []);

  // Check for inactivity (5 minutes)
  const checkInactivity = useCallback(() => {
    const now = new Date();
    const inactiveMinutes = (now.getTime() - lastActivityRef.current.getTime()) / 60000;

    if (inactiveMinutes > 5 && isActiveRef.current) {
      isActiveRef.current = false;
      updateSession();
    }
  }, [updateSession]);

  useEffect(() => {
    // Start session on mount
    startSession();

    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Update session every 30 seconds
    intervalRef.current = setInterval(() => {
      checkInactivity();
      if (isActiveRef.current) {
        updateSession();
      }
    }, 30000);

    // End session on unmount
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      endSession();
    };
  }, [startSession, handleActivity, checkInactivity, updateSession, endSession]);

  // This component doesn't render anything visible
  return null;
}
