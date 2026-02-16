'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { initializeScormAPI } from '@/lib/scorm/api';
import { createClient } from '@/lib/supabase/client';
import { RotateCcw } from 'lucide-react';

interface ScormPlayerWrapperProps {
  packageId: string;
  launchUrl: string;
  version: '1.2' | '2004';
  userId: string;
  enrollmentStatus?: string;
  enrollmentProgress?: number;
  enrollmentScore?: number;
}

export function ScormPlayerWrapper({
  packageId,
  launchUrl,
  version,
  userId,
  enrollmentStatus,
  enrollmentProgress,
  enrollmentScore,
}: ScormPlayerWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(enrollmentStatus || 'not_started');
  const [progress, setProgress] = useState(enrollmentProgress || 0);
  const [score, setScore] = useState<number | null>(enrollmentScore ?? null);
  const [ready, setReady] = useState(false);

  // Persistent attempt ID — fetched from or created in DB
  const attemptId = useRef<string>(`${packageId}-${Date.now()}`);

  // On mount: find or create a persistent attempt so CMI data survives reloads
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();

        // Look for an existing incomplete attempt for this user + package
        const { data: existing } = await supabase
          .from('scorm_attempts')
          .select('id')
          .eq('scorm_package_id', packageId)
          .eq('user_id', userId)
          .in('status', ['not_started', 'incomplete', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existing) {
          attemptId.current = existing.id;
        } else {
          // Create a new attempt row
          const { data: newAttempt } = await supabase
            .from('scorm_attempts')
            .insert({
              scorm_package_id: packageId,
              user_id: userId,
              status: 'not_started',
            })
            .select('id')
            .single();

          if (newAttempt) {
            attemptId.current = newAttempt.id;
          }
        }
      } catch {
        // If DB lookup fails, fall back to timestamp-based ID (no resume, but still works)
      }
      setReady(true);
    })();
  }, [packageId, userId]);

  const saveTracking = useCallback(
    async (newStatus: string, newScore?: number) => {
      try {
        await fetch('/api/scorm/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scormPackageId: packageId,
            userId,
            status: newStatus,
            progress: newStatus === 'completed' || newStatus === 'passed' ? 100 : progress,
            score: newScore ?? score,
            timeSpent: 0,
            cmiData: null,
          }),
        });
      } catch {
        // Tracking failure is non-fatal
      }
    },
    [packageId, userId, progress, score]
  );

  useEffect(() => {
    if (!ready) return;

    // Initialize the SCORM API shim on window so the iframe content can find it
    const api = initializeScormAPI(attemptId.current, version);

    // Intercept key CMI writes to update our UI and tracking
    const origSetValue = api.LMSSetValue.bind(api);
    api.LMSSetValue = (key: string, value: string) => {
      const result = origSetValue(key, value);

      if (key === 'cmi.core.lesson_status' || key === 'cmi.completion_status') {
        setStatus(value);
        if (value === 'completed' || value === 'passed') {
          setProgress(100);
          saveTracking(value, score);
        }
      }
      if (key === 'cmi.core.score.raw' || key === 'cmi.score.raw') {
        const s = parseFloat(value);
        if (!isNaN(s)) {
          setScore(s);
        }
      }

      return result;
    };

    // Also intercept 2004 equivalents
    api.SetValue = api.LMSSetValue;

    const origFinish = api.LMSFinish.bind(api);
    api.LMSFinish = (param: string) => {
      const result = origFinish(param);
      saveTracking(status === 'not_started' ? 'incomplete' : status, score);
      return result;
    };
    api.Terminate = api.LMSFinish;

    return () => {
      // Clean up window API references
      delete (window as any).API;
      delete (window as any).API_1484_11;
    };
  }, [version, ready, saveTracking, score, status]);

  const handleIframeLoad = () => setLoading(false);
  const handleIframeError = () => {
    setError('Failed to load SCORM content');
    setLoading(false);
  };

  const handleRestart = async () => {
    setStatus('incomplete');
    setProgress(0);
    setScore(null);

    // Create a fresh attempt in DB
    try {
      const supabase = createClient();
      const { data: newAttempt } = await supabase
        .from('scorm_attempts')
        .insert({
          scorm_package_id: packageId,
          user_id: userId,
          status: 'not_started',
        })
        .select('id')
        .single();

      if (newAttempt) {
        attemptId.current = newAttempt.id;
      } else {
        attemptId.current = `${packageId}-${Date.now()}`;
      }
    } catch {
      attemptId.current = `${packageId}-${Date.now()}`;
    }

    if (iframeRef.current) {
      iframeRef.current.src = launchUrl;
    }
  };

  const isCompleted = status === 'completed' || status === 'passed';

  return (
    <>
      {/* Progress bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 capitalize">{status.replace('_', ' ')}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {score !== null && (
          <div className="text-sm">
            Score: <span className="font-semibold">{score}%</span>
          </div>
        )}
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <span className="text-slate-400 flex-shrink-0">•</span>
            Complete
          </div>
        )}
        {isCompleted && (
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        )}
      </div>

      {/* SCORM iframe */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
              <p className="text-sm text-slate-600">Loading SCORM content...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-md">
              <p className="text-sm font-medium text-red-900">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  if (iframeRef.current) iframeRef.current.src = launchUrl;
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {ready ? (
          <iframe
            ref={iframeRef}
            src={launchUrl}
            className="h-full w-full border-0"
            title="SCORM Content"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </>
  );
}
