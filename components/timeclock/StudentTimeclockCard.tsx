'use client';

import { useState } from 'react';
import { useTimeclock } from '@/lib/timeclock/useTimeclock';

interface StudentTimeclockCardProps {
  apprenticeId: string;
  partnerId: string;
  programId: string;
  siteId: string;
  siteName?: string;
}

export function StudentTimeclockCard({
  apprenticeId,
  partnerId,
  programId,
  siteId,
  siteName = 'Work Site',
}: StudentTimeclockCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [autoClockOutMessage, setAutoClockOutMessage] = useState<string | null>(null);

  const timeclock = useTimeclock({
    apprenticeId,
    partnerId,
    programId,
    siteId,
    onError: (err) => {
      setError(err);
      setTimeout(() => setError(null), 5000);
    },
    onAutoClockOut: (reason) => setAutoClockOutMessage(reason),
  });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours: number | null) => (hours === null ? '--' : hours.toFixed(2));

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch {
      // useTimeclock reports the actionable message through onError.
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Time Clock</h2>
        <span className="text-sm text-slate-700">{siteName}</span>
      </div>

      {timeclock.pendingSync && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">Saved offline — pending verification</p>
          <p className="mt-1 text-xs text-amber-800">
            Your GPS evidence and timestamp are stored on this device. When a connection returns, the server will verify the assigned site, geofence, chronology, and account before accepting the attendance record.
          </p>
        </div>
      )}

      {timeclock.syncError && (
        <div className="mb-4 rounded-md border border-brand-red-200 bg-brand-red-50 p-3">
          <p className="text-sm font-semibold text-brand-red-800">Offline attendance needs attention</p>
          <p className="mt-1 text-xs text-brand-red-700">{timeclock.syncError}</p>
        </div>
      )}

      <div className="mb-4 p-3 rounded-md bg-slate-50">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              timeclock.pendingSync
                ? 'bg-amber-500'
                : timeclock.gpsPosition
                  ? timeclock.withinGeofence
                    ? 'bg-brand-green-500'
                    : 'bg-slate-400'
                  : 'bg-slate-400'
            }`}
          />
          <span className="text-sm text-slate-900">
            {timeclock.gpsError
              ? timeclock.gpsError
              : timeclock.pendingSync
                ? 'GPS captured; server verification pending'
                : timeclock.gpsPosition
                  ? timeclock.withinGeofence
                    ? 'On-site verified'
                    : 'GPS ready'
                  : 'GPS will be checked when you take an attendance action'}
          </span>
        </div>
        {timeclock.gpsPosition && (
          <p className="text-xs text-slate-700 mt-1">Accuracy: {Math.round(timeclock.gpsPosition.accuracy_m)}m</p>
        )}
      </div>

      {timeclock.isShiftOpen && !timeclock.pendingSync && timeclock.gpsPosition && !timeclock.withinGeofence && !timeclock.autoClockOut && (
        <div className="mb-4 p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">Current location is not server-verified on-site</p>
          <p className="text-xs text-yellow-700 mt-1">The next attendance action will be checked against the assigned host-site geofence.</p>
        </div>
      )}

      {autoClockOutMessage && (
        <div className="mb-4 p-3 rounded-md bg-brand-red-50 border border-brand-red-200">
          <p className="text-sm text-brand-red-800 font-medium">Shift Ended Automatically</p>
          <p className="text-xs text-brand-red-700 mt-1">{autoClockOutMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-md bg-brand-red-50 border border-brand-red-200">
          <p className="text-sm text-brand-red-800">{error}</p>
        </div>
      )}

      {timeclock.isShiftOpen && (
        <div className="mb-4 p-3 rounded-md bg-brand-blue-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-700">Clock In:</span><span className="ml-2 font-medium">{formatTime(timeclock.clockInAt)}</span></div>
            {timeclock.lunchStartAt && <div><span className="text-slate-700">Lunch Start:</span><span className="ml-2 font-medium">{formatTime(timeclock.lunchStartAt)}</span></div>}
            {timeclock.lunchEndAt && <div><span className="text-slate-700">Lunch End:</span><span className="ml-2 font-medium">{formatTime(timeclock.lunchEndAt)}</span></div>}
          </div>
        </div>
      )}

      {timeclock.clockOutAt && (
        <div className="mb-4 p-3 rounded-md bg-brand-green-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-700">Clock In:</span><span className="ml-2 font-medium">{formatTime(timeclock.clockInAt)}</span></div>
            <div><span className="text-slate-700">Clock Out:</span><span className="ml-2 font-medium">{formatTime(timeclock.clockOutAt)}</span></div>
            <div className="col-span-2"><span className="text-slate-700">Hours Worked:</span><span className="ml-2 font-semibold text-brand-green-700">{formatHours(timeclock.hoursWorked)}</span></div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {timeclock.canClockIn && (
          <button
            onClick={() => { setAutoClockOutMessage(null); void run(timeclock.clockIn); }}
            disabled={timeclock.loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${timeclock.loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-green-600 hover:bg-brand-green-700'}`}
          >
            {timeclock.loading ? 'Processing...' : 'Clock In'}
          </button>
        )}

        {timeclock.isShiftOpen && !timeclock.isOnLunch && (
          <div className="grid grid-cols-2 gap-3">
            {timeclock.canStartLunch && (
              <button onClick={() => void run(timeclock.lunchStart)} disabled={timeclock.loading} className={`py-3 px-4 rounded-md font-medium text-white transition-colors ${timeclock.loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'}`}>Start Lunch</button>
            )}
            {timeclock.canClockOut && (
              <button onClick={() => void run(timeclock.clockOut)} disabled={timeclock.loading} className={`py-3 px-4 rounded-md font-medium text-white transition-colors ${timeclock.loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-red-600 hover:bg-brand-red-700'}`}>Clock Out</button>
            )}
          </div>
        )}

        {timeclock.isOnLunch && (
          <button onClick={() => void run(timeclock.lunchEnd)} disabled={timeclock.loading} className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${timeclock.loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'}`}>{timeclock.loading ? 'Processing...' : 'End Lunch'}</button>
        )}

        {timeclock.clockOutAt && !timeclock.pendingSync && (
          <button onClick={() => { timeclock.reset(); setAutoClockOutMessage(null); }} className="w-full py-3 px-4 rounded-md font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors">Start New Shift</button>
        )}
      </div>
    </div>
  );
}
