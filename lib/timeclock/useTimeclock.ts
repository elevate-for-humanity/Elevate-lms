'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import {
  createClientShiftId,
  getPendingTimeclockActions,
  queueTimeclockAction,
  requestTimeclockSync,
  type QueuedTimeclockAction,
} from '@/lib/timeclock/offline-queue';

const MAX_ACCURACY_M = 50;
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

interface GPSPosition {
  lat: number;
  lng: number;
  accuracy_m: number;
}

export interface InitialTimeclockShift {
  entryId: string;
  clockInAt: string;
  lunchStartAt?: string | null;
  lunchEndAt?: string | null;
}

interface TimeclockState {
  progressEntryId: string | null;
  clientShiftId: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  lunchStartAt: string | null;
  lunchEndAt: string | null;
  withinGeofence: boolean;
  autoClockOut: boolean;
  autoClockOutReason: string | null;
  hoursWorked: number | null;
  pendingSync: boolean;
  syncError: string | null;
}

interface HeartbeatResponse {
  within_geofence: boolean;
  distance_m?: number;
  auto_clocked_out: boolean;
  clock_out_at: string | null;
  auto_clock_out_reason: string | null;
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
  queued?: boolean;
  error?: string;
}

interface UseTimeclockOptions {
  apprenticeId: string;
  partnerId: string | null;
  programId: string;
  siteId: string;
  initialShift?: InitialTimeclockShift | null;
  onError?: (error: string) => void;
  onAutoClockOut?: (reason: string) => void;
}

function isOfflineProgressId(value: string | null | undefined) {
  return Boolean(value?.startsWith('offline:'));
}

export function useTimeclock(options: UseTimeclockOptions) {
  const { apprenticeId, partnerId, programId, siteId, initialShift, onError, onAutoClockOut } = options;
  const initialClientShiftIdRef = useRef<string | null>(initialShift ? createClientShiftId() : null);

  const [state, setState] = useState<TimeclockState>(() => ({
    progressEntryId: initialShift?.entryId ?? null,
    clientShiftId: initialClientShiftIdRef.current,
    clockInAt: initialShift?.clockInAt ?? null,
    clockOutAt: null,
    lunchStartAt: initialShift?.lunchStartAt ?? null,
    lunchEndAt: initialShift?.lunchEndAt ?? null,
    withinGeofence: false,
    autoClockOut: false,
    autoClockOutReason: null,
    hoursWorked: null,
    pendingSync: false,
    syncError: null,
  }));

  const [gpsPosition, setGpsPosition] = useState<GPSPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const gpsPositionRef = useRef<GPSPosition | null>(null);

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
          gpsPositionRef.current = pos;
          setGpsPosition(pos);
          setGpsError(null);
          resolve(pos);
        },
        (error) => {
          const message = error.code === 1
            ? 'Location permission denied'
            : error.code === 2
              ? 'Location unavailable'
              : 'Location request timed out';
          setGpsError(message);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

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
          gpsPositionRef.current = pos;
          setGpsPosition(pos);
          setGpsError(null);
        }
      },
      (error) => logger.warn('[Timeclock] GPS watch error', { message: error.message }),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 },
    );
  }, []);

  const stopGPSWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const sendHeartbeat = useCallback(async (progressEntryId: string) => {
    const position = gpsPositionRef.current;
    if (!progressEntryId || !position || isOfflineProgressId(progressEntryId) || !navigator.onLine) return;
    try {
      const response = await fetch('/api/timeclock/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_entry_id: progressEntryId,
          lat: position.lat,
          lng: position.lng,
          accuracy_m: position.accuracy_m,
        }),
      });
      if (!response.ok) return;
      const data: HeartbeatResponse = await response.json();
      setState((prev) => ({
        ...prev,
        withinGeofence: data.within_geofence,
        autoClockOut: data.auto_clocked_out,
        autoClockOutReason: data.auto_clock_out_reason,
        clockOutAt: data.clock_out_at,
      }));
      if (data.auto_clocked_out) {
        onAutoClockOut?.(data.auto_clock_out_reason || 'Auto clock-out triggered');
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      }
    } catch (error) {
      logger.error('[Timeclock] Heartbeat error', error instanceof Error ? error : new Error(String(error)));
    }
  }, [onAutoClockOut]);

  const startHeartbeat = useCallback((progressEntryId: string) => {
    if (!progressEntryId || isOfflineProgressId(progressEntryId) || heartbeatIntervalRef.current) return;
    void sendHeartbeat(progressEntryId);
    heartbeatIntervalRef.current = setInterval(() => void sendHeartbeat(progressEntryId), HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const postOrQueue = useCallback(async (
    action: QueuedTimeclockAction,
    pos: GPSPosition,
    clientShiftId: string,
    progressEntryId?: string | null,
  ): Promise<ActionResponse> => {
    const clientRecordedAt = new Date().toISOString();
    const payload = {
      action,
      apprentice_id: apprenticeId,
      partner_id: partnerId || undefined,
      program_id: programId,
      site_id: siteId,
      progress_entry_id: progressEntryId || undefined,
      lat: pos.lat,
      lng: pos.lng,
      accuracy_m: pos.accuracy_m,
    };

    const queue = async () => {
      await queueTimeclockAction({
        ...payload,
        offline_replay: true,
        client_shift_id: clientShiftId,
        client_recorded_at: clientRecordedAt,
      });
      setState((prev) => ({ ...prev, pendingSync: true, syncError: null }));
      return {
        success: true,
        action,
        progress_entry_id: progressEntryId || `offline:${clientShiftId}`,
        queued: true,
        ...(action === 'clock_in' ? { clock_in_at: clientRecordedAt } : {}),
        ...(action === 'lunch_start' ? { lunch_start_at: clientRecordedAt } : {}),
        ...(action === 'lunch_end' ? { lunch_end_at: clientRecordedAt } : {}),
        ...(action === 'clock_out' ? { clock_out_at: clientRecordedAt } : {}),
      } satisfies ActionResponse;
    };

    if (!navigator.onLine || isOfflineProgressId(progressEntryId)) return queue();

    try {
      const response = await fetch('/api/timeclock/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: ActionResponse = await response.json();
      if (response.ok) return data;
      if (response.status >= 500) return queue();
      throw new Error(data.error || `${action.replaceAll('_', ' ')} failed`);
    } catch (error) {
      if (error instanceof TypeError || !navigator.onLine) return queue();
      throw error;
    }
  }, [apprenticeId, partnerId, programId, siteId]);

  const clockIn = useCallback(async () => {
    setLoading(true);
    try {
      const pos = await requestGPS();
      const clientShiftId = createClientShiftId();
      const data = await postOrQueue('clock_in', pos, clientShiftId);
      const progressEntryId = data.progress_entry_id || null;
      setState((prev) => ({
        ...prev,
        progressEntryId,
        clientShiftId,
        clockInAt: data.clock_in_at || null,
        clockOutAt: null,
        lunchStartAt: null,
        lunchEndAt: null,
        autoClockOut: false,
        autoClockOutReason: null,
        withinGeofence: !data.queued,
        pendingSync: prev.pendingSync || Boolean(data.queued),
        syncError: null,
      }));
      startGPSWatch();
      if (!data.queued && progressEntryId) startHeartbeat(progressEntryId);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Clock in failed';
      onError?.(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [requestGPS, postOrQueue, startGPSWatch, startHeartbeat, onError]);

  const lunchStart = useCallback(async () => {
    if (!state.progressEntryId || !state.clientShiftId) {
      onError?.('No active shift');
      return undefined;
    }
    setLoading(true);
    try {
      const pos = await requestGPS();
      const data = await postOrQueue('lunch_start', pos, state.clientShiftId, state.progressEntryId);
      setState((prev) => ({ ...prev, lunchStartAt: data.lunch_start_at || prev.lunchStartAt, pendingSync: prev.pendingSync || Boolean(data.queued) }));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lunch start failed';
      onError?.(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.progressEntryId, state.clientShiftId, requestGPS, postOrQueue, onError]);

  const lunchEnd = useCallback(async () => {
    if (!state.progressEntryId || !state.clientShiftId) {
      onError?.('No active shift');
      return undefined;
    }
    setLoading(true);
    try {
      const pos = await requestGPS();
      const data = await postOrQueue('lunch_end', pos, state.clientShiftId, state.progressEntryId);
      setState((prev) => ({ ...prev, lunchEndAt: data.lunch_end_at || prev.lunchEndAt, pendingSync: prev.pendingSync || Boolean(data.queued) }));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lunch end failed';
      onError?.(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.progressEntryId, state.clientShiftId, requestGPS, postOrQueue, onError]);

  const clockOut = useCallback(async () => {
    if (!state.progressEntryId || !state.clientShiftId) {
      onError?.('No active shift');
      return undefined;
    }
    setLoading(true);
    try {
      const pos = await requestGPS();
      const data = await postOrQueue('clock_out', pos, state.clientShiftId, state.progressEntryId);
      setState((prev) => ({
        ...prev,
        clockOutAt: data.clock_out_at || prev.clockOutAt,
        hoursWorked: data.hours_worked ?? prev.hoursWorked,
        pendingSync: prev.pendingSync || Boolean(data.queued),
      }));
      stopHeartbeat();
      stopGPSWatch();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Clock out failed';
      onError?.(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.progressEntryId, state.clientShiftId, requestGPS, postOrQueue, stopHeartbeat, stopGPSWatch, onError]);

  const reset = useCallback(() => {
    stopHeartbeat();
    stopGPSWatch();
    setState({
      progressEntryId: null,
      clientShiftId: null,
      clockInAt: null,
      clockOutAt: null,
      lunchStartAt: null,
      lunchEndAt: null,
      withinGeofence: false,
      autoClockOut: false,
      autoClockOutReason: null,
      hoursWorked: null,
      pendingSync: false,
      syncError: null,
    });
  }, [stopHeartbeat, stopGPSWatch]);

  useEffect(() => {
    void getPendingTimeclockActions(apprenticeId).then((actions) => {
      if (actions.length) setState((prev) => ({ ...prev, pendingSync: true }));
    });
    const handleOnline = () => void requestTimeclockSync();
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) void requestTimeclockSync();
    return () => window.removeEventListener('online', handleOnline);
  }, [apprenticeId]);

  useEffect(() => {
    if (!initialShift?.entryId) return;
    let cancelled = false;
    void requestGPS()
      .then(() => {
        if (cancelled) return;
        startGPSWatch();
        startHeartbeat(initialShift.entryId);
      })
      .catch(() => {
        // Location permission/status remains visible in the widget. The next
        // attendance action will request location again before it can proceed.
      });
    return () => { cancelled = true; };
  }, [initialShift?.entryId, requestGPS, startGPSWatch, startHeartbeat]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIMECLOCK_SYNC_REJECTED') {
        setState((prev) => ({
          ...prev,
          syncError: event.data?.data?.error || 'An offline attendance event was rejected during verification.',
        }));
        return;
      }
      if (event.data?.type === 'TIMECLOCK_SYNC_COMPLETE') {
        void getPendingTimeclockActions(apprenticeId).then((actions) => {
          const pending = actions.length > 0;
          setState((prev) => ({ ...prev, pendingSync: pending }));
          if (!pending && event.data?.data?.syncedCount > 0) window.location.reload();
        });
      }
    };
    navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleWorkerMessage);
  }, [apprenticeId]);

  useEffect(() => () => {
    stopHeartbeat();
    stopGPSWatch();
  }, [stopHeartbeat, stopGPSWatch]);

  const isShiftOpen = state.clockInAt !== null && state.clockOutAt === null;
  const isOnLunch = state.lunchStartAt !== null && state.lunchEndAt === null;
  const canClockIn = !isShiftOpen;
  const canStartLunch = isShiftOpen && !isOnLunch && state.lunchStartAt === null;
  const canEndLunch = isOnLunch;
  const canClockOut = isShiftOpen && !isOnLunch;

  return {
    ...state,
    gpsPosition,
    gpsError,
    loading,
    isShiftOpen,
    isOnLunch,
    canClockIn,
    canStartLunch,
    canEndLunch,
    canClockOut,
    clockIn,
    lunchStart,
    lunchEnd,
    clockOut,
    reset,
    requestGPS,
  };
}
