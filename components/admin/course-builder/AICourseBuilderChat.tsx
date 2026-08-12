'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Video,
} from 'lucide-react';

type Program = { id: string; title: string; slug?: string };
type Message = { role: 'user' | 'assistant'; content: string };
type ExistingCourse = { id: string; title: string; slug: string; status?: string };
type GeneratedCourse = {
  title: string;
  subtitle?: string;
  description: string;
  audience?: string;
  duration_hours: number;
  category?: string;
  passing_score?: number;
  completion_rule?: 'all_lessons' | 'required_lessons';
  modules: Array<{
    title: string;
    sort_order: number;
    lessons: Array<{
      lesson_number: number;
      title: string;
      description?: string;
      objectives?: string[];
      content?: string;
      content_type?: 'video' | 'reading' | 'quiz' | 'assignment';
      duration_minutes?: number;
      is_required?: boolean;
      quiz_questions?: Array<{
        question: string;
        options: string[];
        correct_index: number;
        explanation?: string;
      }>;
    }>;
  }>;
};

type Stage = 'chat' | 'review' | 'saving' | 'saved';

const STARTERS = [
  'Build an Indiana barber apprenticeship RTI course with DOL alignment, state-board theory, checkpoints, and a final exam.',
  'Create a medical assistant course aligned to NHA CCMA competencies with clinical and administrative skills.',
  'Build a peer recovery specialist certification course with ethics, documentation, trauma-informed practice, and assessments.',
  'Create an OSHA 10 construction safety course for apprentices with practical scenarios and knowledge checks.',
  'Build a bookkeeping and QuickBooks course for small business owners with hands-on workflows and quizzes.',
];

export default function AICourseBuilderChat({
  programs = [],
  initialProgramId = '',
  onCourseCreated,
}: {
  programs?: Program[];
  initialProgramId?: string;
  onCourseCreated?: (courseId: string) => void | Promise<void>;
}) {
  const initialProgram = programs.find((program) => program.id === initialProgramId);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: initialProgram
        ? `I can design a course for ${initialProgram.title}. Tell me the learner, credential or outcome, target hours, and any state or regulatory requirements you already know.`
        : 'Describe the course you need. I can ask focused questions, then generate a complete reviewable course with modules, lessons, objectives, and knowledge checks.',
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [stage, setStage] = useState<Stage>('chat');
  const [course, setCourse] = useState<GeneratedCourse | null>(null);
  const [programId, setProgramId] = useState(initialProgramId);
  const [state, setState] = useState('Indiana');
  const [credential, setCredential] = useState('');
  const [complianceProfileKey, setComplianceProfileKey] = useState('');
  const [savedCourseId, setSavedCourseId] = useState('');
  const [message, setMessage] = useState('');
  const [existingCourses, setExistingCourses] = useState<ExistingCourse[]>([]);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/courses', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : Array.isArray(data?.courses) ? data.courses : [];
        setExistingCourses(rows.slice(0, 12));
      })
      .catch(() => setExistingCourses([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const totalLessons = useMemo(
    () => course?.modules.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0,
    [course],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      const outbound: Message[] = [...messages, { role: 'user', content: trimmed }];
      setMessages([...outbound, { role: 'assistant', content: '' }]);
      setInput('');
      setStreaming(true);
      setMessage('');

      try {
        const response = await fetch('/api/admin/course-builder/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: outbound }),
        });
        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'AI chat request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';
          for (const chunk of chunks) {
            if (!chunk.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(chunk.slice(6));
              if (event.type === 'text' && event.content) {
                setMessages((current) => {
                  const next = [...current];
                  const index = next.length - 1;
                  next[index] = { role: 'assistant', content: `${next[index]?.content ?? ''}${event.content}` };
                  return next;
                });
              }
              if (event.type === 'course_ready' && event.course) {
                setCourse(event.course);
                setStage('review');
              }
              if (event.type === 'error') throw new Error(event.message || 'AI chat failed');
            } catch (error) {
              if (error instanceof SyntaxError) continue;
              throw error;
            }
          }
        }
      } catch (error) {
        const text = error instanceof Error ? error.message : 'AI chat failed';
        setMessage(text);
        setMessages((current) => {
          const next = [...current];
          const index = next.length - 1;
          next[index] = { role: 'assistant', content: `The request failed: ${text}` };
          return next;
        });
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming],
  );

  async function saveCourse() {
    if (!course) return;
    setStage('saving');
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course,
          programId: programId || undefined,
          state: state || undefined,
          credentialOrExam: credential.trim() || undefined,
          complianceProfileKey: complianceProfileKey || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || 'Course save failed');
      setSavedCourseId(body.courseId);
      setStage('saved');
      setMessage(`Saved ${body.modules} modules and ${body.lessons} lessons as a draft for review.`);
      await onCourseCreated?.(body.courseId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Course save failed');
      setStage('review');
    }
  }

  async function queueVideos() {
    if (!savedCourseId) return;
    setMessage('Queueing missing videos…');
    try {
      const response = await fetch('/api/admin/course-builder/video-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: savedCourseId, onlyMissing: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Video queue failed');
      setMessage(`Queued ${body.queued ?? 0}; skipped ${body.skipped ?? 0}; failed ${body.failed ?? 0}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Video queue failed');
    }
  }

  async function productionRender() {
    if (!savedCourseId) return;
    setMessage('Running production renderer…');
    try {
      const response = await fetch('/api/admin/course-builder/video-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: savedCourseId, force: false }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Production render failed');
      setMessage(`Production render generated ${body.generated ?? 0}; failed ${body.failed ?? 0}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Production render failed');
    }
  }

  if (stage === 'review' || stage === 'saving') {
    return (
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600">AI conversation result</p>
            <h3 className="text-xl font-bold text-slate-900">Review before saving</h3>
            <p className="text-sm text-slate-600">{course?.modules.length ?? 0} modules · {totalLessons} lessons · {course?.duration_hours ?? 0} hours</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStage('chat')} disabled={stage === 'saving'} className="rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">Back to chat</button>
            <button onClick={saveCourse} disabled={stage === 'saving'} className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700 disabled:opacity-50">{stage === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{stage === 'saving' ? 'Saving…' : 'Save reviewed draft'}</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Program"><select value={programId} onChange={(event) => setProgramId(event.target.value)} className="control"><option value="">Standalone course</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></Field>
          <Field label="State"><input value={state} onChange={(event) => setState(event.target.value)} className="control" /></Field>
          <Field label="Credential / exam"><input value={credential} onChange={(event) => setCredential(event.target.value)} placeholder="Optional" className="control" /></Field>
          <Field label="Compliance"><select value={complianceProfileKey} onChange={(event) => setComplianceProfileKey(event.target.value)} className="control"><option value="">Auto-detect</option><option value="internal_basic">Internal Basic</option><option value="state_board_strict">State Board</option><option value="dol_apprenticeship">DOL Apprenticeship</option><option value="naadac_peer_support">NAADAC / Peer Support</option><option value="custom_regulated">Custom Regulated</option></select></Field>
        </div>

        {course && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-5"><h4 className="text-lg font-bold text-slate-900">{course.title}</h4>{course.subtitle && <p className="mt-1 text-sm font-medium text-slate-700">{course.subtitle}</p>}<p className="mt-2 text-sm text-slate-600">{course.description}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>{course.audience || 'Audience not specified'}</span><span>·</span><span>{course.duration_hours} hours</span><span>·</span><span>Pass {course.passing_score ?? 70}%</span></div></div>
            {course.modules.map((module, moduleIndex) => (
              <div key={`${module.title}-${moduleIndex}`} className="overflow-hidden rounded-xl border bg-white">
                <button onClick={() => setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)} className="flex w-full items-center justify-between px-4 py-3 text-left"><div><span className="text-xs font-bold uppercase text-brand-blue-600">Module {module.sort_order}</span><div className="font-semibold text-slate-900">{module.title}</div></div>{expandedModule === moduleIndex ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                {expandedModule === moduleIndex && <div className="divide-y border-t">{module.lessons.map((lesson) => <div key={`${lesson.lesson_number}-${lesson.title}`} className="p-4"><div className="flex items-start justify-between gap-4"><div><div className="font-medium text-slate-900">{lesson.lesson_number}. {lesson.title}</div><p className="mt-1 text-xs text-slate-500">{lesson.description}</p></div><span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{lesson.duration_minutes ?? 20} min</span></div><div className="mt-2 text-xs text-slate-600">{lesson.objectives?.length ? `${lesson.objectives.length} objectives · ` : ''}{lesson.quiz_questions?.length ?? 0} knowledge checks</div></div>)}</div>}
              </div>
            ))}
          </div>
        )}
        {message && <Notice>{message}</Notice>}
        <style jsx>{`.control{width:100%;border:1px solid rgb(203 213 225);border-radius:.5rem;background:white;padding:.55rem .75rem;font-size:.875rem;color:rgb(15 23 42)}`}</style>
      </div>
    );
  }

  if (stage === 'saved') {
    return (
      <div className="space-y-5 rounded-2xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-600" /><div><h3 className="text-xl font-bold text-green-900">Course saved as draft</h3><p className="text-sm text-green-800">{course?.title} · {totalLessons} lessons. It still requires Governance readiness/review before publication.</p></div></div>
        <div className="flex flex-wrap gap-2"><button onClick={queueVideos} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"><Video className="h-4 w-4" />Queue missing videos</button><button onClick={productionRender} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><Clapperboard className="h-4 w-4" />Production render</button><button onClick={() => { setStage('chat'); setCourse(null); setSavedCourseId(''); setMessages([{ role: 'assistant', content: 'Ready for another course. What should we build?' }]); }} className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-800">Build another</button></div>
        {message && <Notice>{message}</Notice>}
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b bg-slate-50 px-5 py-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><MessageSquare className="h-4 w-4 text-brand-blue-600" />Conversational course designer</div><p className="mt-1 text-xs text-slate-500">Clarify requirements through conversation, then review the generated course before it is saved.</p></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((item, index) => <div key={index} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${item.role === 'user' ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>{item.content || (streaming && index === messages.length - 1 ? '…' : '')}</div></div>)}
          <div ref={bottomRef} />
        </div>
        {messages.length <= 2 && <div className="border-t bg-slate-50 px-4 py-3"><div className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500"><Sparkles className="h-3.5 w-3.5" />Starter prompts</div><div className="flex flex-wrap gap-2">{STARTERS.map((starter) => <button key={starter} onClick={() => void sendMessage(starter)} disabled={streaming} className="rounded-full border bg-white px-3 py-1.5 text-left text-xs text-slate-600 hover:border-brand-blue-300 hover:text-brand-blue-700 disabled:opacity-50">{starter}</button>)}</div></div>}
        <div className="border-t p-4"><div className="flex gap-2"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(input); } }} rows={2} placeholder="Describe the course or answer the designer's question…" className="min-w-0 flex-1 resize-none rounded-xl border px-3 py-2 text-sm text-slate-900" /><button onClick={() => void sendMessage(input)} disabled={streaming || !input.trim()} className="flex items-center justify-center rounded-xl bg-brand-blue-600 px-4 text-white hover:bg-brand-blue-700 disabled:opacity-40">{streaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button></div>{message && <div className="mt-2 text-xs text-red-600">{message}</div>}</div>
      </section>

      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><BookOpen className="h-4 w-4" />Existing courses</div><p className="mt-1 text-xs text-slate-500">Context and quick access to courses already in the canonical inventory.</p></div><div className="space-y-2">{existingCourses.map((existing) => <a key={existing.id} href={`/course-builder?courseId=${encodeURIComponent(existing.id)}&tab=build`} className="block rounded-lg border bg-white p-3 hover:border-brand-blue-300"><div className="truncate text-sm font-semibold text-slate-900">{existing.title}</div><div className="mt-1 truncate font-mono text-[11px] text-slate-500">{existing.slug}</div><div className="mt-1 text-[11px] text-slate-400">{existing.status ?? 'draft'}</div></a>)}{!existingCourses.length && <div className="rounded-lg border border-dashed p-4 text-center text-xs text-slate-500">No courses loaded.</div>}</div></aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>{children}</div>;
}
function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">{children}</div>;
}
