'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CourseProvider, useCourse } from '@/components/studio/CourseProvider';
import { StudioShell } from '@/components/studio/StudioShell';
import { BlueprintPanel } from '@/components/studio/panels/BlueprintPanel';
import { CurriculumPanel } from '@/components/studio/panels/CurriculumPanel';
import { QuizPanel } from '@/components/studio/panels/QuizPanel';
import { MediaPanel } from '@/components/studio/panels/MediaPanel';
import { AutomationPanel } from '@/components/studio/panels/AutomationPanel';
import { PublishPanel } from '@/components/studio/panels/PublishPanel';
import { AIPanel } from '@/components/studio/panels/AIPanel';
import { Skeleton } from '@/components/ui/skeleton';

function PanelWorkspace() {
  const { state } = useCourse();
  
  switch (state.activePanel) {
    case 'blueprint':
      return <BlueprintPanel />;
    case 'curriculum':
      return <CurriculumPanel />;
    case 'quiz':
      return <QuizPanel />;
    case 'media':
      return <MediaPanel />;
    case 'automation':
      return <AutomationPanel />;
    case 'publish':
      return <PublishPanel />;
    default:
      return <BlueprintPanel />;
  }
}

export default function StudioCoursePage() {
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
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <CourseProvider session={user}>
      <StudioShell>
        <PanelWorkspace />
      </StudioShell>
      <AIPanel />
    </CourseProvider>
  );
}
