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
    onAutoClockOut: (reason) => {
      setAutoClockOutMessage(reason);
    },
  });

  const handleClockIn = async () => {
    setError(null);
    setAutoClockOutMessage(null);
    try {
      await timeclock.clockIn();
    } catch {
      // Error handled by onError callback
    }
  };

  const handleLunchStart = async () => {
    setError(null);
    try {
      await timeclock.lunchStart();
    } catch {
      // Error handled by onError callback
    }
  };

  const handleLunchEnd = async () => {
    setError(null);
    try {
      await timeclock.lunchEnd();
    } catch {
      // Error handled by onError callback
    }
  };

  const handleClockOut = async () => {
    setError(null);
    try {
      await timeclock.clockOut();
    } catch {
      // Error handled by onError callback
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHours = (hours: number | null) => {
    if (hours === null) return '--';
    return hours.toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Time Clock</h2>
        <span className="text-sm text-slate-700">{siteName}</span>
      </div>

      {/* GPS Status */}
      <div className="mb-4 p-3 rounded-md bg-slate-50">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              timeclock.gpsPosition
                ? timeclock.withinGeofence
                  ? 'bg-brand-green-500'
                  : 'bg-yellow-500'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-sm text-slate-900">
            {timeclock.gpsError
              ? timeclock.gpsError
              : timeclock.gpsPosition
                ? timeclock.withinGeofence
                  ? 'On-site'
                  : 'Off-site'
                : 'Acquiring GPS...'}
          </span>
        </div>
        {timeclock.gpsPosition && (
          <p className="text-xs text-slate-700 mt-1">
            Accuracy: {Math.round(timeclock.gpsPosition.accuracy_m)}m
          </p>
        )}
      </div>

      {/* Off-site Warning Banner */}
      {timeclock.isShiftOpen && !timeclock.withinGeofence && !timeclock.autoClockOut && (
        <div className="mb-4 p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">
            Warning: You are outside the work site
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Return within 15 minutes or your shift will be automatically ended.
          </p>
        </div>
      )}

      {/* Auto Clock-Out Message */}
      {autoClockOutMessage && (
        <div className="mb-4 p-3 rounded-md bg-brand-red-50 border border-brand-red-200">
          <p className="text-sm text-brand-red-800 font-medium">Shift Ended Automatically</p>
          <p className="text-xs text-brand-red-700 mt-1">{autoClockOutMessage}</p>
          <p className="text-xs text-brand-red-700 mt-2">
            You may clock in again to start a new shift.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-brand-red-50 border border-brand-red-200">
          <p className="text-sm text-brand-red-800">{error}</p>
        </div>
      )}

      {/* Shift Info */}
      {timeclock.isShiftOpen && (
        <div className="mb-4 p-3 rounded-md bg-brand-blue-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-700">Clock In:</span>
              <span className="ml-2 font-medium">{formatTime(timeclock.clockInAt)}</span>
            </div>
            {timeclock.lunchStartAt && (
              <div>
                <span className="text-slate-700">Lunch Start:</span>
                <span className="ml-2 font-medium">{formatTime(timeclock.lunchStartAt)}</span>
              </div>
            )}
            {timeclock.lunchEndAt && (
              <div>
                <span className="text-slate-700">Lunch End:</span>
                <span className="ml-2 font-medium">{formatTime(timeclock.lunchEndAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed Shift Info */}
      {timeclock.clockOutAt && (
        <div className="mb-4 p-3 rounded-md bg-brand-green-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-700">Clock In:</span>
              <span className="ml-2 font-medium">{formatTime(timeclock.clockInAt)}</span>
            </div>
            <div>
              <span className="text-slate-700">Clock Out:</span>
              <span className="ml-2 font-medium">{formatTime(timeclock.clockOutAt)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-700">Hours Worked:</span>
              <span className="ml-2 font-semibold text-brand-green-700">
                {formatHours(timeclock.hoursWorked)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Clock In Button */}
        {timeclock.canClockIn && (
          <button
            onClick={handleClockIn}
            disabled={timeclock.loading || !timeclock.withinGeofence}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              timeclock.loading || !timeclock.withinGeofence
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-brand-green-600 hover:bg-brand-green-700'
            }`}
          >
            {timeclock.loading ? 'Processing...' : 'Clock In'}
          </button>
        )}

        {/* Lunch Buttons */}
        {timeclock.isShiftOpen && !timeclock.isOnLunch && (
          <div className="grid grid-cols-2 gap-3">
            {timeclock.canStartLunch && (
              <button
                onClick={handleLunchStart}
                disabled={timeclock.loading || !timeclock.withinGeofence}
                className={`py-3 px-4 rounded-md font-medium text-white transition-colors ${
                  timeclock.loading || !timeclock.withinGeofence
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                Start Lunch
              </button>
            )}
            {timeclock.canClockOut && (
              <button
                onClick={handleClockOut}
                disabled={timeclock.loading || !timeclock.withinGeofence}
                className={`py-3 px-4 rounded-md font-medium text-white transition-colors ${
                  timeclock.loading || !timeclock.withinGeofence
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-brand-red-600 hover:bg-brand-red-700'
                }`}
              >
                Clock Out
              </button>
            )}
          </div>
        )}

        {/* End Lunch Button */}
        {timeclock.isOnLunch && (
          <button
            onClick={handleLunchEnd}
            disabled={timeclock.loading || !timeclock.withinGeofence}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              timeclock.loading || !timeclock.withinGeofence
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {timeclock.loading ? 'Processing...' : 'End Lunch'}
          </button>
        )}

        {/* New Shift Button (after clock out) */}
        {timeclock.clockOutAt && (
          <button
            onClick={() => {
              timeclock.reset();
              setAutoClockOutMessage(null);
            }}
            className="w-full py-3 px-4 rounded-md font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Start New Shift
          </button>
        )}
      </div>

      {/* Geofence Disabled Notice */}
      {timeclock.isShiftOpen && !timeclock.withinGeofence && (
        <p className="mt-3 text-xs text-center text-slate-700">
          Actions disabled while outside work site
        </p>
      )}
    </div>
  );
}
