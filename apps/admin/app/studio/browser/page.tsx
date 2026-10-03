'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CloudBrowserWorkspace = dynamic(() => import('@/components/studio/CloudBrowserWorkspace'), {
  ssr: false,
  loading: () => <div className="flex min-h-[720px] items-center justify-center text-slate-400">Connecting cloud browser…</div>,
});

export default function StudioBrowserPage() {
  const [request,setRequest]=useState<{id:string;command:string;context:{browser_target:string;media_gaps:Array<{sceneId:string;visualRequirement:string}>}}|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const runId=new URLSearchParams(window.location.search).get('acquisitionRunId');
    if(!runId)return;
    let current=true;
    void fetch(`/api/admin/ultimate-course-builder?acquisitionRunId=${encodeURIComponent(runId)}`,{cache:'no-store'})
      .then(async response=>{
        const payload=await response.json();
        if(!response.ok || !payload.acquisition)throw new Error(payload.error || 'Media request could not be loaded');
        if(current)setRequest(payload.acquisition);
      }).catch(cause=>{if(current)setError(cause instanceof Error?cause.message:'Media request could not be loaded');});
    return ()=>{current=false;};
  },[]);
  return <main className="h-full min-h-0 overflow-auto">
    {error && <p role="alert" className="p-4 text-red-700">{error}</p>}
    {request && <details className="p-4"><summary className="font-semibold">Required scenes for this lesson ({request.context.media_gaps.length})</summary>
      <ol className="list-decimal space-y-2 pl-6">{request.context.media_gaps.map(scene=><li key={scene.sceneId}>{scene.visualRequirement}</li>)}</ol>
    </details>}
    <CloudBrowserWorkspace autoStart={Boolean(request)} autoRunTask={Boolean(request)}
      acquisitionRunId={request?.id || ''} initialTarget={request?.context.browser_target || ''} initialTask={request?.command || ''}/>
  </main>;
}
