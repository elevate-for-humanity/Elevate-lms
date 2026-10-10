'use client';

import { useState } from 'react';
import { ResumeBuilder } from '@/components/career/ResumeBuilder';
import { createClient } from '@/lib/supabase/client';

export function ResumeBuilderPage() {
  const [message, setMessage] = useState('');
  return <div className="space-y-4">
    <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Career services</p><h1 className="mt-2 text-3xl font-black text-slate-950">Build your professional resume</h1><p className="mt-2 text-slate-700">Your resume is saved to your authenticated learner account.</p></div>
    {message ? <p role="status" className="rounded-xl bg-emerald-50 p-3 font-bold text-emerald-900">{message}</p> : null}
    <ResumeBuilder onSave={async (resumeData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage('Sign in again to save your resume.'); return; }
      const { data: existing, error: readError } = await supabase.from('resumes').select('id').eq('user_id', user.id).maybeSingle();
      if (readError) { setMessage(`Resume could not be loaded: ${readError.message}`); throw readError; }
      const payload = { user_id: user.id, resume_data: resumeData, updated_at: new Date().toISOString() };
      const { error } = existing
        ? await supabase.from('resumes').update(payload).eq('id', existing.id).eq('user_id', user.id)
        : await supabase.from('resumes').insert(payload);
      setMessage(error ? `Resume could not be saved: ${error.message}` : 'Resume saved.');
      if (error) throw error;
    }} />
  </div>;
}
