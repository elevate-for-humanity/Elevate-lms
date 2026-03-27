'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Coffee, 
  LogOut,
  Loader2,
  ArrowLeft,
  RefreshCw,
  History,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const LOCATION_TIMEOUT_MS = 10000;
const MAX_ACCURACY_M = 50;

interface TimeclockContext {
  apprenticeId: string;
  userId: string;
  programId: string;
  programName: string;
  partnerId: string | null;
  defaultSiteId: string | null;
  allowedSites: { id: string; name: string; lat: number; lng: number; radius_m: number }[];
  hoursCompleted: number;
  hoursRequired: number;
  activeShift: {
    entryId: string;
    clockInAt: string;
    lunchStartAt: string | null;
    lunchEndAt: string | null;
    siteId: string;
  } | null;
}

interface ShiftState {
  entryId: string | null;
  clockInAt: string | null;
  lunchStartAt: string | null;
  lunchEndAt: string | null;
  clockOutAt: string | null;
}

interface LocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeofenceState {
  withinGeofence: boolean | null;
  distance: number | null;
  lastCheck: string | null;
}

export default function TimeclockPage() {
  const router = useRouter();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  
  // Context from API (replaces placeholder IDs)
  const [context, setContext] = useState<TimeclockContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  
  // Selected site (from allowedSites)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  
  const [shift, setShift] = useState<ShiftState>({
    entryId: null,
    clockInAt: null,
    lunchStartAt: null,
    lunchEndAt: null,
    clockOutAt: null,
  });
  
  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: false,
  });
  
  const [geofence, setGeofence] = useState<GeofenceState>({
    withinGeofence: null,
    distance: null,
    lastCheck: null,
  });
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recent shift history
  const [recentShifts, setRecentShifts] = useState<{
    id: string;
    work_date: string;
    clock_in_at: string | null;
    clock_out_at: string | null;
    hours_worked: number | null;
    status: string | null;
    auto_clocked_out: boolean | null;
  }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch timeclock context on mount
  useEffect(() => {
    async function fetchContext() {
      try {
        const response = await fetch('/api/timeclock/context');
        const data = await response.json();
        
        if (!response.ok) {
          if (data.code === 'NO_APPRENTICESHIP') {
            setContextError('You do not have an active apprenticeship. Please contact your program coordinator.');
          } else if (response.status === 401) {
            router.push('/login?redirect=/apprentice/timeclock');
            return;
          } else {
            setContextError(data.error || 'Failed to load timeclock');
          }
          return;
        }
        
        setContext(data);
        setSelectedSiteId(data.defaultSiteId);
        
        // If there's an active shift, restore it
        if (data.activeShift) {
          setShift({
            entryId: data.activeShift.entryId,
            clockInAt: data.activeShift.clockInAt,
            lunchStartAt: data.activeShift.lunchStartAt,
            lunchEndAt: data.activeShift.lunchEndAt,
            clockOutAt: null,
          });
        }
      } catch (err) {
        setContextError('Failed to connect to server');
      } finally {
        setContextLoading(false);
      }
    }
    
    fetchContext();
  }, [router]);

  // Fetch recent shift history once context is loaded
  useEffect(() => {
    if (!context) return;
    setHistoryLoading(true);
    const supabase = createClient();
    supabase
      .from('progress_entries')
      .select('id,work_date,clock_in_at,clock_out_at,hours_worked,status,auto_clocked_out')
      .eq('apprentice_id', context.apprenticeId)
      .not('clock_in_at', 'is', null)
      .order('work_date', { ascending: false })
      .limit(7)
      .then(({ data }) => {
        setRecentShifts(data ?? []);
        setHistoryLoading(false);
      });
  }, [context]);

  // Get current location
  const getLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      setLocation(prev => ({ ...prev, loading: true, error: null }));
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            loading: false,
          });
          resolve(position);
        },
        (err) => {
          const errorMsg = err.code === 1 
            ? 'Location permission denied. Please enable location access.'
            : err.code === 2 
            ? 'Location unavailable. Please try again.'
            : 'Location request timed out.';
          setLocation(prev => ({ ...prev, error: errorMsg, loading: false }));
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: LOCATION_TIMEOUT_MS,
          maximumAge: 0,
        }
      );
    });
  }, []);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!shift.entryId) return;
    
    try {
      const position = await getLocation();
      
      const response = await fetch('/api/timeclock/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: shift.entryId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setGeofence({
          withinGeofence: data.within_geofence,
          distance: data.distance_m,
          lastCheck: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Heartbeat failed:', err);
    }
  }, [shift.entryId, getLocation]);

  // Start heartbeat polling
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    
    // Send immediately
    sendHeartbeat();
    
    // Then poll every 2 minutes
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat]);

  // Stop heartbeat polling
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopHeartbeat();
  }, [stopHeartbeat]);

  // Resume heartbeat on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shift.entryId && !shift.clockOutAt) {
        sendHeartbeat();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [shift.entryId, shift.clockOutAt, sendHeartbeat]);

  // Timeclock action handler
  const handleAction = async (action: 'clock_in' | 'lunch_start' | 'lunch_end' | 'clock_out') => {
    if (!context) return;
    
    setActionLoading(action);
    setError(null);
    
    try {
      const position = await getLocation();
      
      if (position.coords.accuracy > MAX_ACCURACY_M) {
        setError(`GPS accuracy too low (${Math.round(position.coords.accuracy)}m). Please wait for better signal.`);
        setActionLoading(null);
        return;
      }
      
      // Require site selection for clock-in
      if (action === 'clock_in' && !selectedSiteId) {
        setError('Please select a work site before clocking in.');
        setActionLoading(null);
        return;
      }
      
      const response = await fetch('/api/timeclock/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          apprentice_id: context.apprenticeId,
          partner_id: context.partnerId,
          program_id: context.programId,
          site_id: selectedSiteId,
          progress_entry_id: shift.entryId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Action failed');
        setActionLoading(null);
        return;
      }
      
      // Update shift state based on action
      switch (action) {
        case 'clock_in':
          setShift({
            entryId: data.progress_entry_id,
            clockInAt: data.clock_in_at,
            lunchStartAt: null,
            lunchEndAt: null,
            clockOutAt: null,
          });
          startHeartbeat();
          break;
          
        case 'lunch_start':
          setShift(prev => ({ ...prev, lunchStartAt: data.lunch_start_at }));
          break;
          
        case 'lunch_end':
          setShift(prev => ({ ...prev, lunchEndAt: data.lunch_end_at }));
          break;
          
        case 'clock_out':
          setShift(prev => ({ ...prev, clockOutAt: data.clock_out_at }));
          stopHeartbeat();
          break;
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const isClockedIn = shift.clockInAt && !shift.clockOutAt;
  const isOnLunch = shift.lunchStartAt && !shift.lunchEndAt;

  // Loading state
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading timeclock...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (contextError || !context) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-md mx-auto px-4">
          <Link 
            href="/apprentice" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-brand-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Access Timeclock</h2>
              <p className="text-gray-600 mb-4">{contextError || 'Unable to load timeclock context'}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Nav strip */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/apprentice" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/apprentice/timeclock/history" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              Shift Log
            </Link>
            <Link href="/apprentice/hours" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              Hours
            </Link>
            <Link href="/apprentice/competencies/log" className="px-3 py-1.5 bg-brand-blue-50 hover:bg-brand-blue-100 text-brand-blue-700 rounded-lg font-medium transition">
              + Competency
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-brand-blue-600" />
            Timeclock
          </h1>
          <p className="text-sm text-gray-600 mb-6">{context.programName}</p>
          
          {/* Hours Progress */}
          <div className="mb-6 p-3 bg-brand-blue-50 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-brand-blue-700 font-medium">Hours Progress</span>
              <span className="text-brand-blue-700">{context.hoursCompleted} / {context.hoursRequired}</span>
            </div>
            <div className="w-full bg-brand-blue-200 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (context.hoursCompleted / context.hoursRequired) * 100)}%` }}
              />
            </div>
          </div>

          {/* Site Selection (only show if not clocked in and has multiple sites) */}
          {!isClockedIn && context.allowedSites.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Site
              </label>
              {context.allowedSites.length === 1 ? (
                <div className="p-3 bg-white rounded-lg text-sm text-gray-700">
                  {context.allowedSites[0].name}
                </div>
              ) : (
                <select
                  value={selectedSiteId || ''}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="">Select a site...</option>
                  {context.allowedSites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          {/* No site assigned warning */}
          {!isClockedIn && context.allowedSites.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  No work site assigned. Please contact your program coordinator.
                </span>
              </div>
            </div>
          )}

          {/* Location Status */}
          <div className="mb-6 p-4 bg-white rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className={`w-5 h-5 mr-2 ${location.error ? 'text-brand-red-500' : 'text-brand-green-500'}`} />
                <span className="text-sm font-medium">
                  {location.loading ? 'Getting location...' : 
                   location.error ? 'Location error' :
                   location.lat ? `${location.lat.toFixed(4)}, ${location.lng?.toFixed(4)}` :
                   'Location not available'}
                </span>
              </div>
              {location.accuracy && (
                <span className={`text-xs px-2 py-1 rounded ${
                  location.accuracy <= MAX_ACCURACY_M ? 'bg-brand-green-100 text-brand-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  ±{Math.round(location.accuracy)}m
                </span>
              )}
            </div>
            {location.error && (
              <p className="text-sm text-brand-red-600 mt-2">{location.error}</p>
            )}
          </div>

          {/* Geofence Status */}
          {geofence.withinGeofence !== null && (
            <div className={`mb-6 p-4 rounded-lg ${
              geofence.withinGeofence ? 'bg-brand-green-50' : 'bg-brand-red-50'
            }`}>
              <div className="flex items-center">
                {geofence.withinGeofence ? (
                  <span className="text-slate-500 flex-shrink-0">•</span>
                ) : (
                  <AlertTriangle className="w-5 h-5 mr-2 text-brand-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  geofence.withinGeofence ? 'text-brand-green-700' : 'text-brand-red-700'
                }`}>
                  {geofence.withinGeofence ? 'Within work site' : 'Outside work site'}
                  {geofence.distance && ` (${Math.round(geofence.distance)}m away)`}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-brand-red-600" />
                <span className="text-sm text-brand-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Shift Status */}
          {isClockedIn && (
            <div className="mb-6 p-4 bg-brand-blue-50 rounded-lg">
              <p className="text-sm text-brand-blue-700">
                <strong>Clocked in:</strong> {new Date(shift.clockInAt!).toLocaleTimeString()}
              </p>
              {shift.lunchStartAt && (
                <p className="text-sm text-brand-blue-700 mt-1">
                  <strong>Lunch started:</strong> {new Date(shift.lunchStartAt).toLocaleTimeString()}
                </p>
              )}
              {shift.lunchEndAt && (
                <p className="text-sm text-brand-blue-700 mt-1">
                  <strong>Lunch ended:</strong> {new Date(shift.lunchEndAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isClockedIn ? (
              <button
                onClick={() => handleAction('clock_in')}
                disabled={actionLoading !== null || location.loading || !selectedSiteId}
                className="w-full flex items-center justify-center px-6 py-4 bg-brand-green-600 hover:bg-brand-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
              >
                {actionLoading === 'clock_in' ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Clock className="w-5 h-5 mr-2" />
                )}
                Clock In
              </button>
            ) : (
              <>
                {!isOnLunch && !shift.lunchEndAt && (
                  <button
                    onClick={() => handleAction('lunch_start')}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {actionLoading === 'lunch_start' ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Coffee className="w-5 h-5 mr-2" />
                    )}
                    Start Lunch
                  </button>
                )}
                
                {isOnLunch && (
                  <button
                    onClick={() => handleAction('lunch_end')}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {actionLoading === 'lunch_end' ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Coffee className="w-5 h-5 mr-2" />
                    )}
                    End Lunch
                  </button>
                )}
                
                <button
                  onClick={() => handleAction('clock_out')}
                  disabled={actionLoading !== null || isOnLunch}
                  className="w-full flex items-center justify-center px-6 py-4 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
                >
                  {actionLoading === 'clock_out' ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5 mr-2" />
                  )}
                  Clock Out
                </button>
              </>
            )}
          </div>

          {/* Shift Complete */}
          {/* ── RECENT SHIFT LOG ── */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-brand-blue-500" />
                Recent Shifts
              </h2>
              <Link
                href="/apprentice/timeclock/history"
                className="text-xs text-brand-blue-600 hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
              </div>
            ) : recentShifts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No shifts recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {recentShifts.map((s) => {
                  const hrs = s.hours_worked ?? 0;
                  const isToday = s.work_date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        {s.auto_clocked_out ? (
                          <XCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : s.clock_out_at ? (
                          <CheckCircle2 className="w-4 h-4 text-brand-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-brand-blue-500 flex-shrink-0 animate-pulse" />
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {isToday ? 'Today' : new Date(s.work_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.clock_in_at ? new Date(s.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            {' → '}
                            {s.clock_out_at ? new Date(s.clock_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : s.clock_in_at ? 'Active' : '—'}
                            {s.auto_clocked_out && ' (auto)'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{hrs.toFixed(1)}h</p>
                        <p className={`text-xs capitalize ${
                          s.status === 'approved' ? 'text-brand-green-600' :
                          s.status === 'rejected' ? 'text-brand-red-600' :
                          'text-gray-400'
                        }`}>{s.status ?? 'pending'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {shift.clockOutAt && (
            <div className="mt-6 p-4 bg-brand-green-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span className="text-sm font-medium text-brand-green-700">
                  Shift complete! Clocked out at {new Date(shift.clockOutAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
