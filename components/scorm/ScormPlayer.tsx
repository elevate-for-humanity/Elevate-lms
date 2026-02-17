"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';
// components/scorm/ScormPlayer.tsx

import { useEffect, useRef, useState } from 'react';
import { initializeScormAPI } from '@/lib/scorm/api';

interface ScormPlayerProps {
  packageId: string;
  attemptId: string;
  version: '1.2' | '2004';
  launchUrl: string;
  storagePath: string;
}

export function ScormPlayer({
  packageId,
  attemptId,
  version,
  launchUrl,
  storagePath,
}: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize SCORM API
    const api = initializeScormAPI(attemptId, version);

    // Log SCORM attempt to database
    const logAttempt = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('scorm_attempts').upsert({
        attempt_id: attemptId,
        package_id: packageId,
        user_id: user?.id,
        scorm_version: version,
        started_at: new Date().toISOString(),
        status: 'in_progress',
      }).catch(() => {});
    };
    logAttempt();

    // Handle iframe load
    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setError('Failed to load SCORM content');
      setLoading(false);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      }
    };
  }, [attemptId, version, packageId]);

  const contentUrl = `/api/scorm/content/${packageId}/${launchUrl}`;

  return (
    <div className="relative h-screen w-full bg-slate-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-orange-500 border-t-transparent" />
            <p className="text-sm text-black">Loading SCORM content...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-brand-red-200 bg-brand-red-50 p-6 text-center">
            <p className="text-sm font-medium text-brand-red-900">{error}</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={contentUrl}
        className="h-full w-full border-0"
        title="SCORM Content"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
