'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTenantRequestHeaders } from './TenantPreviewContext';
import type { HiringProfile, HiringPublicState, HiringQuestion } from '@/lib/tenant/hiring-types';

const initial: HiringProfile = { role: 'individual', name: '', email: '', phone: '', company: '', serviceArea: '', services: '', experience: '', availability: '', capacity: '', equipment: '', insurance: '', qualificationsNote: '' };
type ResponseData = { error?: string; token?: string; state?: HiringPublicState; questions?: HiringQuestion[] };
export function TenantHiringApplication({ websiteId, businessName, accent }: { websiteId: string; businessName: string; accent: string }) {
  const previewHeaders = useTenantRequestHeaders();
  const storageKey = `efh-hiring-${websiteId}`;
  const [profile, setProfile] = useState(initial);
  const [state, setState] = useState<HiringPublicState | null>(null);
  const [token, setToken] = useState('');
  const [questions, setQuestions] = useState<HiringQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const busy = busyAction !== null;
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const buttonClass = 'rounded-full px-6 py-3 font-bold text-white disabled:opacity-40';
  const inputClass = 'mt-2 w-full rounded-xl border border-slate-400 bg-white p-3 text-slate-950';

  useEffect(() => {
    let active = true;
    async function resume() {
      let saved: { id: string; token: string } | null = null;
      try { saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return; }
      if (!saved?.id || !saved.token) return;
      try {
        const response = await fetch('/api/tenant-sites/hiring', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${saved.token}`, ...previewHeaders }, body: JSON.stringify({ action: 'resume', id: saved.id }) });
        const result: ResponseData = await response.json();
        if (!active) return;
        if (!response.ok || !result.state) { setError(result.error || 'Your previous application could not be restored.'); return; }
        setState(result.state); setProfile(result.state.profile); setToken(saved.token); setQuestions(result.questions || []);
      } catch { if (active) setError('Your previous application could not be loaded. Please retry by reloading this page.'); }
    }
    void resume(); return () => { active = false; };
  }, [storageKey, previewHeaders]);

  async function request(action: string, extra: Record<string, unknown> = {}, upload?: File): Promise<boolean> {
    if (busy) return false;
    setBusyAction(action); setError('');
    try {
      const headers: Record<string, string> = { ...previewHeaders };
      if (token) headers.Authorization = `Bearer ${token}`;
      let body: FormData | string;
      if (upload && state) { const form = new FormData(); form.set('id', state.id); form.set('version', String(state.version)); form.set('file', upload); body = form; }
      else { headers['Content-Type'] = 'application/json'; body = JSON.stringify({ action, id: state?.id, version: state?.version, ...extra }); }
      const response = await fetch('/api/tenant-sites/hiring', { method: 'POST', headers, body, signal: AbortSignal.timeout(65000) });
      const result: ResponseData = await response.json();
      if (!response.ok || !result.state) throw new Error(result.error || 'The application could not be saved.');
      setState(result.state); if (result.questions) setQuestions(result.questions);
      if (result.token) {
        setToken(result.token);
        try { sessionStorage.setItem(storageKey, JSON.stringify({ id: result.state.id, token: result.token })); }
        catch { setError('Your application is open, but this browser cannot keep it after a reload. Please finish on this page.'); }
      }
      return true;
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Please retry.'); return false; }
    finally { setBusyAction(null); }
  }
  function update<K extends keyof HiringProfile>(key: K, value: HiringProfile[K]) { setProfile(previous => ({ ...previous, [key]: value })); }
  function field(key: keyof HiringProfile, label: string, required = true, multiline = false) {
    return <label className={`block font-bold ${multiline ? 'sm:col-span-2' : ''}`}>{label}{required ? ' *' : ''}{multiline ? <textarea required={required} rows={3} maxLength={key === 'experience' ? 2000 : key === 'equipment' ? 1000 : 1500} value={profile[key]} onChange={e => update(key, e.target.value)} className={inputClass} /> : <input required={required} maxLength={key === 'phone' ? 40 : key === 'name' ? 160 : key === 'email' ? 240 : key === 'company' || key === 'capacity' ? 200 : 500} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} value={profile[key]} onChange={e => update(key, e.target.value)} className={inputClass} />}</label>;
  }
  async function start(event: FormEvent) { event.preventDefault(); await request('start', { profile, consent }); }
  async function interview(event: FormEvent) { event.preventDefault(); if (await request('interview', { answer: interviewAnswer })) setInterviewAnswer(''); }

  return <section className="mx-auto max-w-4xl px-5 py-14 sm:px-6">
    <h2 className="text-3xl font-black">Apply for cleaning work or company partnerships</h2>
    <p className="mt-4 leading-7 text-slate-600">Application → qualifications → cleaning skills assessment → PARIS interview → {businessName} review. Assignments are offered as needed when customer jobs or contracts become available. This process checks job knowledge and collects evidence; it does not certify experience or make a hiring decision.</p>
    {error ? <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 font-semibold text-red-900">{error}</p> : null}
    {state?.submittedAt ? <div role="status" className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6"><h3 className="text-2xl font-black">Your application is submitted.</h3><p className="mt-3">{businessName} received your application, qualification details, skills results and PARIS interview for review. We will contact you about verification and next steps. A job or contract has not been confirmed.</p><p className="mt-3 text-sm">Application reference: {state.id}</p></div> : !state ? <form onSubmit={start} className="mt-8 space-y-6 rounded-2xl border bg-white p-6">
      <h3 className="text-2xl font-black">1. Your application</h3>
      <label className="block font-bold">I am applying as *<select value={profile.role} onChange={e => update('role', e.target.value as HiringProfile['role'])} className={inputClass}><option value="individual">As-needed cleaner / janitorial worker</option><option value="company">Cleaning company / business partner</option><option value="apprentice">Building Technician apprenticeship interest</option></select></label>
      <div className="grid gap-5 sm:grid-cols-2">{field('name', 'Contact name')}{field('email', 'Email')}{field('phone', 'Phone')}{field('company', 'Cleaning company name', profile.role === 'company')}{field('serviceArea', 'Cities or counties you can serve')}{field('availability', 'Days, times and earliest availability')}{field('capacity', 'Individual or team capacity')}{field('insurance', 'Business insurance status', false)}{field('services', 'Cleaning services you provide or want to learn', true, true)}{field('experience', 'Relevant work examples or training interests', true, true)}{field('equipment', 'Supplies and equipment you can provide', false, true)}{field('qualificationsNote', 'Qualifications, references or documents you can provide', false, true)}</div>
      <p className="text-sm leading-6 text-slate-600">You can upload PDFs or photos after starting. New applicants may explain their training interests if they do not yet hold certificates. Do not submit Social Security numbers, bank details, identity documents or medical records.</p>
      <label className="flex gap-3 leading-6"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" /><span>I authorize {businessName} to review these application details and contact me about cleaning work, company partnerships or apprenticeship opportunities.</span></label>
      <button disabled={busy || !consent} className={buttonClass} style={{ backgroundColor: accent }}>{busyAction === 'start' ? 'Saving…' : 'Start my application'}</button>
    </form> : <div className="mt-8 space-y-8">
      <div className="rounded-2xl border bg-white p-6"><h3 className="text-2xl font-black">Application saved for {state.profile.name}</h3><p className="mt-2">Type: {state.profile.role === 'company' ? 'Cleaning company / business partner' : state.profile.role === 'apprentice' ? 'Building Technician apprenticeship interest' : 'As-needed cleaner / janitorial worker'}</p></div>
      <section className="rounded-2xl border bg-white p-6"><h3 className="text-2xl font-black">2. Upload your qualifications</h3><p className="mt-3 leading-7 text-slate-600">Upload relevant training certificates, a résumé, references you have permission to share, or company registration and insurance evidence. Up to five files, 5 MB each; PDF, PNG or JPEG. Files are private to this application and the authorized website reviewers.</p><ul className="mt-4 list-disc pl-6">{state.documents.map(d => <li key={d.id}>{d.name} · {Math.ceil(d.bytes / 1024)} KB</li>)}</ul><label className="mt-5 block font-bold">Qualification file<input type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full font-normal" /></label><button type="button" disabled={busy || !file || state.documents.length >= 5} onClick={async () => { if (file && await request('upload', {}, file)) setFile(null); }} className={`${buttonClass} mt-4`} style={{ backgroundColor: accent }}>{busyAction === 'upload' ? 'Saving…' : 'Upload qualification'}</button>{!state.documents.length && (state.profile.role !== 'apprentice' || !state.profile.qualificationsNote) ? <p className="mt-4 text-sm text-amber-900">Companies and individual cleaners must upload at least one relevant document. Beginning apprentices may instead describe their training interests in the application.</p> : null}</section>
      <section className="rounded-2xl border bg-white p-6"><h3 className="text-2xl font-black">3. Cleaning skills assessment</h3><p className="mt-3 leading-7 text-slate-600">Answer based on how you would work. This checks cleaning knowledge and workplace situations, including safety, reliability and handling customer requests. Your results are reviewed with your experience and training needs.</p>{state.assessment ? <div role="status" className="mt-5"><p className="font-bold">Knowledge score: {state.assessment.score}% · Saved</p><p className="mt-2">Topics for discussion: {state.assessment.reviewTopics.join(', ') || 'No missed topics in this assessment.'}</p><p className="mt-2 text-sm">This result is not a certification, honesty rating or hiring decision.</p></div> : <form onSubmit={async e => { e.preventDefault(); await request('assessment', { answers }); }}><div className="mt-5 space-y-5">{questions.map((q, i) => <fieldset key={q.id} className="rounded-xl border p-4"><legend className="px-2 font-bold">{i + 1}. {q.question}</legend>{q.options.map((option, index) => <label key={option} className="mt-3 flex gap-3 rounded-lg border p-3"><input required type="radio" name={`hiring-${q.id}`} checked={answers[q.id] === index} onChange={() => setAnswers(previous => ({ ...previous, [q.id]: index }))} className="mt-1 shrink-0" /><span>{option}</span></label>)}</fieldset>)}</div><button disabled={busy || !questions.length || Object.keys(answers).length !== questions.length} className={`${buttonClass} mt-6`} style={{ backgroundColor: accent }}>{busyAction === 'assessment' ? 'Saving…' : 'Save skills assessment'}</button></form>}</section>
      <section className="rounded-2xl border bg-white p-6"><h3 className="text-2xl font-black">4. Interview with PARIS</h3><p className="mt-3 leading-7 text-slate-600">PARIS asks five job-related questions about your experience, work approach and qualifications. Your answers are saved for the {businessName} team. You can type at your own pace.</p>{!state.assessment ? <p className="mt-5 font-semibold">Complete the skills assessment to begin.</p> : <><div role="log" aria-live="polite" className="mt-6 space-y-4">{state.interview.messages.map((message, index) => <div key={index} className={`rounded-xl p-4 ${message.role === 'PARIS' ? 'bg-slate-100' : 'border bg-white'}`}><p className="font-bold">{message.role}</p><p className="mt-2 whitespace-pre-wrap leading-7">{message.text}</p></div>)}</div>{state.interview.complete ? <p role="status" className="mt-5 font-bold text-emerald-800">Your PARIS interview is saved.</p> : <form onSubmit={interview} className="mt-5"><label className="block font-bold">Your answer to PARIS<textarea required minLength={2} maxLength={2000} rows={5} value={interviewAnswer} onChange={e => setInterviewAnswer(e.target.value)} className={inputClass} /></label><button disabled={busy || interviewAnswer.trim().length < 2} className={`${buttonClass} mt-4`} style={{ backgroundColor: accent }}>{busyAction === 'interview' ? 'PARIS is responding…' : 'Save answer and continue'}</button><p className="mt-3 text-sm">Question {Math.min(5, state.interview.answered + 1)} of 5</p></form>}</>}</section>
      <section className="rounded-2xl border bg-white p-6"><h3 className="text-2xl font-black">5. Submit for review</h3><p className="mt-3 leading-7 text-slate-600">Submit when the skills assessment and PARIS interview are saved. Individual cleaners and companies must upload at least one relevant qualification or business document. Beginning apprenticeship applicants may instead describe their training interests and available documents. {businessName} verifies evidence, references, availability and contract requirements before discussing a placement.</p><button type="button" disabled={busy || !state.assessment || !state.interview.complete || (!state.documents.length && (state.profile.role !== 'apprentice' || !state.profile.qualificationsNote))} onClick={() => request('submit')} className={`${buttonClass} mt-5`} style={{ backgroundColor: accent }}>{busyAction === 'submit' ? 'Submitting…' : 'Submit application for review'}</button></section>
    </div>}
  </section>;
}
