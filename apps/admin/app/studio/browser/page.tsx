'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useStudioViewport } from '@/components/studio/useStudioViewport';
import { useEffect, useState } from 'react';

const CloudBrowserWorkspace = dynamic(() => import('@/components/studio/CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-slate-600">
      Connecting cloud browser…
    </div>
  ),
});

export default function StudioBrowserPage() {
  const viewportStyle = useStudioViewport();
  const [request, setRequest] = useState<{
    id: string;
    command: string;
    context: {
      browser_target: string;
      media_gaps: Array<{ sceneId: string; visualRequirement: string }>;
    };
  } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const runId = new URLSearchParams(window.location.search).get('acquisitionRunId');
    if (!runId) return;
    let current = true;
    void fetch(`/api/admin/ultimate-course-builder?acquisitionRunId=${encodeURIComponent(runId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.acquisition)
          throw new Error(payload.error || 'Media request could not be loaded');
        if (current) setRequest(payload.acquisition);
      })
      .catch((cause) => {
        if (current)
          setError(cause instanceof Error ? cause.message : 'Media request could not be loaded');
      });
    return () => {
      current = false;
    };
  }, []);
  return (
    <main
      style={viewportStyle}
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white"
    >
      <Link
        href="/studio"
        className="flex min-h-11 shrink-0 items-center px-4 text-base font-semibold text-slate-950 lg:hidden"
      >
        Back to Studio chat
      </Link>
      {error && (
        <p role="alert" className="p-4 text-red-700">
          {error}
        </p>
      )}
      {request && (
        <details className="max-h-[25vh] shrink-0 overflow-auto p-3 text-base text-slate-950">
          <summary className="font-semibold">
            Required scenes for this lesson ({request.context.media_gaps.length})
          </summary>
          <ol className="list-decimal space-y-2 pl-6">
            {request.context.media_gaps.map((scene) => (
              <li key={scene.sceneId}>{scene.visualRequirement}</li>
            ))}
          </ol>
        </details>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        <CloudBrowserWorkspace
          autoStart={Boolean(request)}
          autoRunTask={Boolean(request)}
          acquisitionRunId={request?.id || ''}
          initialTarget={request?.context.browser_target || ''}
          initialTask={request?.command || ''}
        />
      </div>
    </main>
  );
}
