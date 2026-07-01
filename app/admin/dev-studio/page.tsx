'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DevStudioMobileShell = dynamic(
  () => import('@/components/studio/DevStudioMobileShell'),
  { ssr: false, loading: () => <DevStudioLoading /> }
);

function DevStudioLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

export default function DevStudioPage() {
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('https://www.elevateforhumanity.org');

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Fetch system health
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setHealth(await res.json());
        }
      } catch (err) {
        console.error('Health check failed:', err);
      }
      
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <DevStudioLoading />;
  }

  return (
    <DevStudioMobileShell
      isSuperAdmin={true}
      health={health}
      previewUrl={previewUrl}
      livePreviewUrl={previewUrl}
      onPreviewUrlChange={setPreviewUrl}
      onPreviewGo={() => window.open(previewUrl, '_blank')}
      workflowButtons={[
        { key: 'build', label: 'Build', description: 'Run production build' },
        { key: 'deploy', label: 'Deploy', description: 'Deploy to staging' },
        { key: 'test', label: 'Test', description: 'Run test suite' },
      ]}
    />
  );
}
