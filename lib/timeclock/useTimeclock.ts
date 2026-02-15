import { logger } from '@/lib/logger';
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const MAX_ACCURACY_M = 50;
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

interface GPSPosition {
  lat: number;
  lng: number;
  accuracy_m: number;
}

interface TimeclockState {
  progressEntryId: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  lunchStartAt: string | null;
  lunchEndAt: string | null;
  withinGeofence: boolean;
  autoClockOut: boolean;
  autoClockOutReason: string | null;
  hoursWorked: number | null;
}

interface HeartbeatResponse {
  within_geofence: boolean;
  distance_m?: number;
  auto_clocked_out: boolean;
  clock_out_at: string | null;
  auto_clock_out_reason: string | null;
  closed?: boolean;
}

interface ActionResponse {
  success: boolean;
  action: string;
  progress_entry_id?: string;
  clock_in_at?: string;
  clock_out_at?: string;
  lunch_start_at?: string;
  lunch_end_at?: string;
  hours_worked?: number;
  error?: string;
}

interface UseTimeclockOptions {
  apprenticeId: string;
  partnerId: string;
  programId: string;
  siteId: string;
  onError?: (error: string) => void;
  onAutoClockOut?: (reason: string) => void;
}

export function useTimeclock(options: UseTimeclockOptions) {
  const { apprenticeId, partnerId, programId, siteId, onError, onAutoClockOut } = options;

  const [state, setState] = useState<TimeclockState>({
    progressEntryId: null,
    clockInAt: null,
    clockOutAt: null,
    lunchStartAt: null,
    lunchEndAt: null,
    withinGeofence: false,
    autoClockOut: false,
    autoClockOutReason: null,
    hoursWorked: null,
  });

  const [gpsPosition, setGpsPosition] = useState<GPSPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  /**
   * Request high-accuracy GPS position
   */
  const requestGPS = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: GPSPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy_m: position.coords.accuracy,
          };

          if (pos.accuracy_m > MAX_ACCURACY_M) {
            reject(new Error(`GPS accuracy too low: ${Math.round(pos.accuracy_m)}m (max ${MAX_ACCURACY_M}m)`));
            return;
          }

          setGpsPosition(pos);
          setGpsError(null);
          resolve(pos);
        },
        (error) => {
          const errorMsg = error.code === 1
            ? 'Location permission denied'
            : error.code === 2
            ? 'Location unavailable'
            : 'Location request timed out';
          setGpsError(errorMsg);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  /**
   * Start continuous GPS watching
   */
  const startGPSWatch = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const pos: GPSPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        };
        if (pos.accuracy_m <= MAX_ACCURACY_M) {
          setGpsPosition(pos);
          setGpsError(null);
        }
      },
      (error) => {
        logger.warn('[Timeclock] GPS watch error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000,
      }
    );
  }, []);

  /**
   * Stop GPS watching
   */
  const stopGPSWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  /**
   * Send heartbeat to server
   */
  const sendHeartbeat = useCallback(async () => {
    if (!state.progressEntryId || !gpsPosition) return;

    try {
      const response = await fetch('/api/timeclock/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_entry_id: state.progressEntryId,
          lat: gpsPosition.lat,
          lng: gpsPosition.lng,
          accuracy_m: gpsPosition.accuracy_m,
        }),
      });

      const data: HeartbeatResponse = await response.json();

      setState((prev) => ({
        ...prev,
        withinGeofence: data.within_geofence,
        autoClockOut: data.auto_clocked_out,
        autoClockOutReason: data.auto_clock_out_reason,
        clockOutAt: data.clock_out_at,
      }));

      if (data.auto_clocked_out && onAutoClockOut) {
        onAutoClockOut(data.auto_clock_out_reason || 'Auto clock-out triggered');
        stopHeartbeat();
      }
    } catch (error) {
      logger.error('[Timeclock] Heartbeat error:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.progressEntryId, gpsPosition, onAutoClockOut]);

  /**
   * Start heartbeat interval
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat]);

  /**
   * Stop heartbeat interval
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Clock in action
   */
  const clockIn = useCallback(async () => {
    setLoading(true);
    try {
      const pos = await requestGPS();

      const response = await fetch('/api/timeclock/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock_in',
          apprentice_id: apprenticeId,
          partner_id: partnerId,
          program_id: programId,
          site_id: siteId,
          lat: pos.lat,
          lng: pos.lng,
          accuracy_m: pos.accuracy_m,
        }),
      });

      const data: ActionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Clock in failed');
      }

      setState((prev) => ({
        ...prev,
        progressEntryId: data.progress_entry_id || null,
        clockInAt: data.clock_in_at || null,
        clockOutAt: null,
        lunchStartAt: null,
        lunchEndAt: null,
        autoClockOut: false,
        autoClockOutReason: null,
        withinGeofence: true,
      }));

      startGPSWatch();
      startHeartbeat();

      return data;
    } catch (error: any) {
      onError?.(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apprenticeId, partnerId, programId, siteId, requestGPS, startGPSWatch, startHeartbeat, onError]);

  /**
   * Lunch start action
   */
  const lunchStart = useCallback(async () => {
    if (!state.progressEntryId) {
      onError?.('No active shift');
      return;
    }

    setLoading(true);
    try {
      const pos = await requestGPS();

      const response = await fetch('/api/timeclock/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lunch_start',
          apprentice_id: apprenticeId,
          partner_id: partnerId,
          program_id: programId,
          site_id: siteId,
          progress_entry_id: state.progressEntryId,
          lat: pos.lat,
          lng: pos.lng,
          accuracy_m: pos.accuracy_m,
        }),
      });

      const data: ActionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lunch start failed');
      }

      setState((prev) => ({
        ...prev,
        lunchStartAt: data.lunch_start_at || null,
      }));

      return data;
    } catch (error: any) {
      onError?.(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.progressEntryId, apprenticeId, partnerId, programId, siteId, requestGPS, onError]);

  /**
   * Lunch end action
   */
  const lunchEnd = useCallback(async () => {
    if (!state.progressEntryId) {
      onError?.('No active shift');
      return;
    }

    setLoading(true);
    try {
      const pos = await requestGPS();

      const response = await fetch('/api/timeclock/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lunch_end',
          apprentice_id: apprenticeId,
          partner_id: partnerId,
          program_id: programId,
          site_id: siteId,
          progress_entry_id: state.progressEntryId,
          lat: pos.lat,
          lng: pos.lng,
          accuracy_m: pos.accuracy_m,
        }),
      });

      const data: ActionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lunch end failed');
      }

      setState((prev) => ({
        ...prev,
        lunchEndAt: data.lunch_end_at || null,
      }));

      return data;
    } catch (error: any) {
      onError?.(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.progressEntryId, apprenticeId, partnerId, programId, siteId, requestGPS, onError]);

  /**
   * Clock out action
   */
  const clockOut = useCallback(async () => {
    if (!state.progressEntryId) {
      onError?.('No active shift');
      return;
    }

    setLoading(true);
    try {
      const pos = await requestGPS();

      const response = await fetch('/api/timeclock/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock_out',
          apprentice_id: apprenticeId,
          partner_id: partnerId,
          program_id: programId,
          site_id: siteId,
          progress_entry_id: state.progressEntryId,
          lat: pos.lat,
          lng: pos.lng,
          accuracy_m: pos.accuracy_m,
        }),
      });

      const data: ActionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Clock out failed');
      }

      setState((prev) => ({
        ...prev,
        clockOutAt: data.clock_out_at || null,
        hoursWorked: data.hours_worked || null,
      }));

      stopHeartbeat();
      stopGPSWatch();

      return data;
    } catch (error: any) {
      onError?.(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.progressEntryId, apprenticeId, partnerId, programId, siteId, requestGPS, stopHeartbeat, stopGPSWatch, onError]);

  /**
   * Reset state for new shift
   */
  const reset = useCallback(() => {
    stopHeartbeat();
    stopGPSWatch();
    setState({
      progressEntryId: null,
      clockInAt: null,
      clockOutAt: null,
      lunchStartAt: null,
      lunchEndAt: null,
      withinGeofence: false,
      autoClockOut: false,
      autoClockOutReason: null,
      hoursWorked: null,
    });
  }, [stopHeartbeat, stopGPSWatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      stopGPSWatch();
    };
  }, [stopHeartbeat, stopGPSWatch]);

  // Derived state
  const isShiftOpen = state.clockInAt !== null && state.clockOutAt === null;
  const isOnLunch = state.lunchStartAt !== null && state.lunchEndAt === null;
  const canClockIn = !isShiftOpen;
  const canStartLunch = isShiftOpen && !isOnLunch && state.lunchStartAt === null;
  const canEndLunch = isOnLunch;
  const canClockOut = isShiftOpen && !isOnLunch;

  return {
    // State
    ...state,
    gpsPosition,
    gpsError,
    loading,

    // Derived
    isShiftOpen,
    isOnLunch,
    canClockIn,
    canStartLunch,
    canEndLunch,
    canClockOut,

    // Actions
    clockIn,
    lunchStart,
    lunchEnd,
    clockOut,
    reset,
    requestGPS,
  };
}
