'use client';

import { useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResumeUploads } from '@/components/career/ResumeUploads';
import { ResumeBuilder } from '@/components/career/ResumeBuilder';
import { createClient } from '@/lib/supabase/client';

export function ResumeBuilderPage({
  initialData,
}: {
  initialData?: ComponentProps<typeof ResumeBuilder>['initialData'];
}) {
  const [message, setMessage] = useState('');
  const router = useRouter();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">
          Career services
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Build your professional resume</h1>
        <p className="mt-2 text-slate-700">
          Your resume is saved to your authenticated learner account.
        </p>
      </div>
      {message ? (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 font-bold text-emerald-900">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-4">
        <Link href="/lms/career" className="font-bold underline">
          See jobs matching my skills
        </Link>
        <Link href="/lms/dashboard" className="font-bold underline">
          Back to dashboard
        </Link>
      </div>
      <ResumeUploads />
      <ResumeBuilder
        initialData={initialData}
        onSave={async (resumeData) => {
          setMessage('');
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('Sign in again to save your resume.');
          }
          const { data: existing, error: readError } = await supabase
            .from('resumes')
            .select('id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (readError) {
            throw readError;
          }
          const payload = {
            user_id: user.id,
            resume_data: resumeData,
            updated_at: new Date().toISOString(),
          };
          const { error } = existing
            ? await supabase
                .from('resumes')
                .update(payload)
                .eq('id', existing.id)
                .eq('user_id', user.id)
            : await supabase.from('resumes').insert(payload);
          if (error) throw error;
          setMessage('Resume saved. Your skills and credentials will inform your career feed.');
          router.refresh();
        }}
      />
    </div>
  );
}
