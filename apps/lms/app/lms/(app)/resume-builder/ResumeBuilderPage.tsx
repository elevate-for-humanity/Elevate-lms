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
      const { error } = await supabase.from('resumes').upsert({ user_id: user.id, resume_data: resumeData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      setMessage(error ? `Resume could not be saved: ${error.message}` : 'Resume saved.');
    }} />
  </div>;
}
