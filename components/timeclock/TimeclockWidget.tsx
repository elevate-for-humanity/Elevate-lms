'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useTimeclock } from '@/lib/timeclock/useTimeclock';

interface TimeclockWidgetProps {
  apprenticeId: string;
  siteId: string;
  partnerId: string;
  programId: string;
  siteName?: string;
}

export function TimeclockWidget({
  apprenticeId,
  siteId,
  partnerId,
  programId,
  siteName,
}: TimeclockWidgetProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoClockOutMsg, setAutoClockOutMsg] = useState<string | null>(null);

  const timeclock = useTimeclock({
    apprenticeId,
    partnerId,
    programId,
    siteId,
    onError: (err) => {
      setErrorMsg(err);
      setTimeout(() => setErrorMsg(null), 5000);
    },
    onAutoClockOut: (reason) => {
      setAutoClockOutMsg(reason);
    },
  });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const buttonBase =
    'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const primaryButton = `${buttonBase} bg-brand-green-600 text-white hover:bg-brand-green-700`;
  const secondaryButton = `${buttonBase} bg-slate-200 text-slate-800 hover:bg-slate-300`;
  const dangerButton = `${buttonBase} bg-brand-red-600 text-white hover:bg-brand-red-700`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Time Clock</h3>
          {siteName && <span className="text-sm text-slate-500">{siteName}</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {timeclock.isShiftOpen ? (
            timeclock.isOnLunch ? (
              <>
                <span className="w-3 h-3 rounded-full bg-brand-blue-500 animate-pulse" />
                <span className="text-brand-blue-600">On lunch</span>
              </>
            ) : timeclock.withinGeofence ? (
              <>
                <span className="w-3 h-3 rounded-full bg-brand-green-500 animate-pulse" />
                <span className="text-brand-green-600">Clocked in</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-yellow-600">Off-site</span>
              </>
            )
          ) : timeclock.autoClockOut ? (
            <>
              <span className="w-3 h-3 rounded-full bg-brand-red-500" />
              <span className="text-brand-red-600">Auto clocked out</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-500">Not clocked in</span>
            </>
          )}
        </div>
      </div>

      {/* Off-site warning */}
      {timeclock.isShiftOpen && !timeclock.withinGeofence && !timeclock.autoClockOut && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-yellow-800">You are outside the work site</p>
          <p className="text-xs text-yellow-700 mt-1">
            Return within 15 minutes or your shift will be automatically ended.
          </p>
        </div>
      )}

      {/* Auto clock-out message */}
      {autoClockOutMsg && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-brand-red-800">Shift ended automatically</p>
          <p className="text-xs text-brand-red-700 mt-1">{autoClockOutMsg}</p>
        </div>
      )}

      {/* GPS / error messages */}
      {(timeclock.gpsError || errorMsg) && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-brand-red-700">{errorMsg ?? timeclock.gpsError}</p>
        </div>
      )}

      {/* Shift time info */}
      {(timeclock.isShiftOpen || timeclock.clockOutAt) && (
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {timeclock.clockInAt && (
            <div>
              <span className="text-slate-500">Clock in:</span>
              <span className="ml-2 font-medium">{formatTime(timeclock.clockInAt)}</span>
            </div>
          )}
          {timeclock.clockOutAt && (
            <div>
              <span className="text-slate-500">Clock out:</span>
              <span className="ml-2 font-medium">{formatTime(timeclock.clockOutAt)}</span>
            </div>
          )}
          {timeclock.lunchStartAt && (
            <div>
              <span className="text-slate-500">Lunch start:</span>
              <span className="ml-2 font-medium">{formatTime(timeclock.lunchStartAt)}</span>
            </div>
          )}
          {timeclock.lunchEndAt && (
            <div>
              <span className="text-slate-500">Lunch end:</span>
              <span className="ml-2 font-medium">{formatTime(timeclock.lunchEndAt)}</span>
            </div>
          )}
          {timeclock.hoursWorked !== null && (
            <div className="col-span-2">
              <span className="text-slate-500">Hours worked:</span>
              <span className="ml-2 font-medium">{timeclock.hoursWorked.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* GPS accuracy */}
      {timeclock.gpsPosition && (
        <p className="text-xs text-slate-400 mb-3">
          GPS accuracy: {Math.round(timeclock.gpsPosition.accuracy_m)}m
        </p>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        {timeclock.canClockIn && (
          <button
            onClick={async () => {
              setErrorMsg(null);
              setAutoClockOutMsg(null);
              try {
                await timeclock.clockIn();
              } catch (err) {
                logger.error('[TimeclockWidget] clockIn failed', err);
              }
            }}
            disabled={timeclock.loading}
            className={`w-full ${primaryButton}`}
          >
            {timeclock.loading ? 'Clocking in…' : 'Clock In'}
          </button>
        )}

        {timeclock.canStartLunch && (
          <button
            onClick={async () => {
              setErrorMsg(null);
              try {
                await timeclock.lunchStart();
              } catch (err) {
                logger.error('[TimeclockWidget] lunchStart failed', err);
              }
            }}
            disabled={timeclock.loading}
            className={`w-full ${secondaryButton}`}
          >
            {timeclock.loading ? 'Saving…' : 'Start Lunch'}
          </button>
        )}

        {timeclock.canEndLunch && (
          <button
            onClick={async () => {
              setErrorMsg(null);
              try {
                await timeclock.lunchEnd();
              } catch (err) {
                logger.error('[TimeclockWidget] lunchEnd failed', err);
              }
            }}
            disabled={timeclock.loading}
            className={`w-full ${secondaryButton}`}
          >
            {timeclock.loading ? 'Saving…' : 'End Lunch'}
          </button>
        )}

        {timeclock.canClockOut && (
          <button
            onClick={async () => {
              setErrorMsg(null);
              try {
                await timeclock.clockOut();
              } catch (err) {
                logger.error('[TimeclockWidget] clockOut failed', err);
              }
            }}
            disabled={timeclock.loading}
            className={`w-full ${dangerButton}`}
          >
            {timeclock.loading ? 'Clocking out…' : 'Clock Out'}
          </button>
        )}

        {timeclock.clockOutAt && (
          <button
            onClick={() => {
              timeclock.reset();
              setAutoClockOutMsg(null);
            }}
            className={`w-full ${secondaryButton}`}
          >
            Start New Shift
          </button>
        )}
      </div>
    </div>
  );
}
