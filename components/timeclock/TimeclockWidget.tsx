'use client';

import { useTimeclock, TimeclockState } from '@/hooks/useTimeclock';
import { formatDistanceToNow } from 'date-fns';

interface TimeclockWidgetProps {
  siteId: string;
  partnerId: string;
  programId: string;
}

export function TimeclockWidget({ siteId, partnerId, programId }: TimeclockWidgetProps) {
  const {
    status,
    isLoading,
    clockIn,
    clockOut,
    startLunch,
    endLunch,
    resetAfterAutoClockOut,
  } = useTimeclock({ siteId, partnerId, programId });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatGraceTime = (seconds: number | null) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStateIndicator = () => {
    switch (status.state) {
      case 'idle':
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Not clocked in</span>
          </div>
        );
      case 'clocked_in':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span>Clocked in</span>
          </div>
        );
      case 'offsite_grace':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
            <span>Offsite - Return within {formatGraceTime(status.graceTimeRemaining)}</span>
          </div>
        );
      case 'auto_clocked_out':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Auto clocked out</span>
          </div>
        );
      case 'on_lunch':
        return (
          <div className="flex items-center gap-2 text-brand-blue-600">
            <span className="w-3 h-3 rounded-full bg-brand-blue-500 animate-pulse" />
            <span>On lunch break</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderWarningBanner = () => {
    if (status.state === 'offsite_grace') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-800">You are offsite</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Return to your work site within {formatGraceTime(status.graceTimeRemaining)} to avoid automatic clock-out.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status.state === 'auto_clocked_out') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-red-800">Automatically clocked out</h4>
              <p className="text-sm text-red-700 mt-1">
                You were clocked out at {formatTime(status.clockOutAt)} for leaving the work site for more than 15 minutes.
              </p>
              <button
                onClick={resetAfterAutoClockOut}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Dismiss and clock in again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderAlertBanner = () => {
    if (!status.alert) return null;

    return (
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-brand-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-brand-blue-700">{status.alert}</p>
        </div>
      </div>
    );
  };

  const renderErrorBanner = () => {
    if (!status.error) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{status.error}</p>
        </div>
      </div>
    );
  };

  const renderActions = () => {
    const buttonBase = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const primaryButton = `${buttonBase} bg-green-600 text-white hover:bg-green-700`;
    const secondaryButton = `${buttonBase} bg-gray-200 text-gray-800 hover:bg-gray-300`;
    const dangerButton = `${buttonBase} bg-red-600 text-white hover:bg-red-700`;

    switch (status.state) {
      case 'idle':
        return (
          <button
            onClick={clockIn}
            disabled={isLoading}
            className={primaryButton}
          >
            {isLoading ? 'Clocking in...' : 'Clock In'}
          </button>
        );

      case 'clocked_in':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startLunch}
              disabled={isLoading || !!status.lunchStartAt}
              className={secondaryButton}
            >
              {status.lunchStartAt ? 'Lunch taken' : 'Start Lunch'}
            </button>
            <button
              onClick={clockOut}
              disabled={isLoading}
              className={dangerButton}
            >
              {isLoading ? 'Clocking out...' : 'Clock Out'}
            </button>
          </div>
        );

      case 'on_lunch':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={endLunch}
              disabled={isLoading}
              className={primaryButton}
            >
              {isLoading ? 'Ending lunch...' : 'End Lunch'}
            </button>
          </div>
        );

      case 'offsite_grace':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clockOut}
              disabled={isLoading}
              className={dangerButton}
            >
              {isLoading ? 'Clocking out...' : 'Clock Out Now'}
            </button>
          </div>
        );

      case 'auto_clocked_out':
        return (
          <button
            onClick={() => {
              resetAfterAutoClockOut();
              // Small delay to allow state reset before clock in
              setTimeout(clockIn, 100);
            }}
            disabled={isLoading}
            className={primaryButton}
          >
            {isLoading ? 'Clocking in...' : 'Clock In Again'}
          </button>
        );

      default:
        return null;
    }
  };

  const renderTimeInfo = () => {
    if (status.state === 'idle' && !status.clockOutAt) return null;

    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        {status.clockInAt && (
          <div>
            <span className="text-gray-500">Clock in:</span>
            <span className="ml-2 font-medium">{formatTime(status.clockInAt)}</span>
          </div>
        )}
        {status.clockOutAt && (
          <div>
            <span className="text-gray-500">Clock out:</span>
            <span className="ml-2 font-medium">{formatTime(status.clockOutAt)}</span>
          </div>
        )}
        {status.lunchStartAt && (
          <div>
            <span className="text-gray-500">Lunch start:</span>
            <span className="ml-2 font-medium">{formatTime(status.lunchStartAt)}</span>
          </div>
        )}
        {status.lunchEndAt && (
          <div>
            <span className="text-gray-500">Lunch end:</span>
            <span className="ml-2 font-medium">{formatTime(status.lunchEndAt)}</span>
          </div>
        )}
        {status.hoursWorked !== null && (
          <div className="col-span-2">
            <span className="text-gray-500">Hours worked:</span>
            <span className="ml-2 font-medium">{status.hoursWorked.toFixed(2)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Time Clock</h3>
        {renderStateIndicator()}
      </div>

      {renderWarningBanner()}
      {renderAlertBanner()}
      {renderErrorBanner()}

      <div className="space-y-4">
        {renderTimeInfo()}
        
        <div className="pt-4 border-t border-gray-100">
          {renderActions()}
        </div>

        {status.gpsAccuracy !== null && (
          <div className="text-xs text-gray-400 mt-2">
            GPS accuracy: {Math.round(status.gpsAccuracy)}m
          </div>
        )}
      </div>
    </div>
  );
}
