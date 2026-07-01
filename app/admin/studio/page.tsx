'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CourseProvider } from '@/components/studio/CourseProvider';
import StudioShell from '@/components/studio/StudioShell';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudioPage() {
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <CourseProvider>
      <StudioShell />
    </CourseProvider>
  );
}
