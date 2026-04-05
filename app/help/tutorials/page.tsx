import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TutorialsClient } from './TutorialsClient';
import { BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Video Tutorials | Help Center | Elevate For Humanity',
  description: 'Step-by-step video tutorials to help you get the most out of the Elevate LMS platform.',
};

export default async function TutorialsPage() {
  const db = createAdminClient();

  const { data: tutorials, error } = await (db ?? (await createClient()))
    .from('tutorials')
    .select('id, slug, title, description, category, thumbnail_url, video_url, duration')
    .eq('is_published', true)
    .order('sort_order');

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-700 mb-2">Tutorials unavailable</h1>
          <p className="text-slate-500 text-sm">
            Apply migration <code className="bg-slate-100 px-1 rounded">20260528000001_tutorials_table.sql</code> in the Supabase Dashboard to enable this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Video Tutorials</h1>
          <p className="text-slate-500">Step-by-step guides to help you get the most out of Elevate LMS.</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <TutorialsClient tutorials={tutorials ?? []} />
      </div>
    </div>
  );
}
