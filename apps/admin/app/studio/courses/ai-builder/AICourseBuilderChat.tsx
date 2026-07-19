'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Program {
  id: string;
  title: string;
  slug: string;
}

interface ExistingCourse {
  id: string;
  title: string;
  slug: string;
  status: string;
  manageUrl: string;
  viewUrl: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeneratedCourse {
  title: string;
  subtitle: string;
  description: string;
  audience: string;
  duration_hours: number;
  category: string;
  passing_score: number;
  completion_rule: string;
  modules: {
    title: string;
    sort_order: number;
    lessons: {
      lesson_number: number;
      title: string;
      description: string;
      content: string;
      duration_minutes: number;
      quiz_questions: {
        question: string;
        options: string[];
        correct_index: number;
        explanation: string;
      }[];
    }[];
  }[];
}

type Stage = 'chat' | 'review' | 'saving' | 'saved';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;

const STARTER_PROMPTS = [
  'Build a cosmetology / esthetics course for Indiana state board exam prep',
  'Create a peer recovery specialist certification course — 40 hours, CARES Act aligned',
  'Build a nail technician course covering sanitation, nail art, and state board prep',
  'Create an OSHA 10 construction safety course for apprentices',
  'Build a bookkeeping and QuickBooks course for small business owners',
];

export default function AICourseBuilderChat({
  programs,
  embedded = false,
  initialProgramId = '',
}: {
  programs: Program[];
  embedded?: boolean;
  initialProgramId?: string;
}) {
  const router = useRouter();

  // Resolve program title for the greeting when arriving from a specific program
  const initialProgram = programs.find((p) => p.id === initialProgramId);
  const initialGreeting = initialProgram
    ? `Hi! I'm your AI course designer. I see you want to build a course for **${initialProgram.title}**.\n\nTell me more about what this course should cover — who it's for, what credential or outcome it leads to, and roughly how many hours it should be. I'll build the full structure with lessons, quizzes, and content.`
    : `Hi! I'm your AI course designer. Tell me what course you want to build — the topic, who it's for, and any credential or regulatory requirements — and I'll create the full course structure with lessons, quizzes, and content.\n\nOr pick a starter below to get going fast.`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialGreeting },
  ]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<Stage>('chat');
  const [streaming, setStreaming] = useState(false);
  const [course, setCourse] = useState<GeneratedCourse | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [existingCourses, setExistingCourses] = useState<ExistingCourse[]>([]);

  // Load existing courses from DB on mount
  useEffect(() => {
    fetch('/api/admin/lms/courses')
      .then((r) => r.json())
      .then((data: { courses?: { id: string; title: string; slug: string; status: string }[] }) => {
        const courses = (data.courses ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          status: c.status,
          manageUrl: `/admin/courses/${c.id}`,
          viewUrl: `${SITE_URL}/lms/courses/${c.id}`,
        }));
        setExistingCourses(courses);
      })
      .catch(() => {/* non-critical — sidebar just stays empty */});
  }, []);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [generatingVideos, setGeneratingVideos] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || streaming) return;

      const newMessages: Message[] = [...messages, { role: 'user', content: userText.trim() }];
      setMessages(newMessages);
      setInput('');
      setStreaming(true);

      // Add empty assistant message to stream into
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      try {
        const res = await fetch('/api/admin/courses/ai-builder/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!res.ok || !res.body) {
          throw new Error('Failed to connect to AI');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'text') {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: updated[updated.length - 1].content + event.content,
                  };
                  return updated;
                });
              } else if (event.type === 'course_ready') {
                setCourse(event.course);
                setStage('review');
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch {
              continue;
            }
          }
        }
      } catch (err: any) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `Sorry, something went wrong: ${err.message}. Please try again.`,
          };
          return updated;
        });
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const saveCourse = async () => {
    if (!course) return;
    setStage('saving');
    setSaveError(null);

    try {
      const res = await fetch('/api/admin/courses/generate/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course,
          program_id: selectedProgramId || undefined,
          is_published: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSavedCourseId(data.courseId);
      setStage('saved');
    } catch (err: any) {
      setSaveError(err.message);
      setStage('review');
    }
  };

  const generateVideos = async () => {
    if (!savedCourseId) return;
    setGeneratingVideos(true);
    setVideoResult(null);
    try {
      const res = await fetch(`/api/admin/courses/${savedCourseId}/generate-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVideoResult(`❌ ${data.error}`);
      } else {
        setVideoResult(
          `✅ Generated ${data.generated} videos${data.failed ? ` · ${data.failed} failed` : ''}`,
        );
      }
    } catch (err: any) {
      setVideoResult(`❌ ${err.message}`);
    } finally {
      setGeneratingVideos(false);
    }
  };

  const totalLessons = course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0;

  // ── Saved state ────────────────────────────────────────────────────────────
  if (stage === 'saved' && savedCourseId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Saved!</h2>
          <p className="text-slate-500 mb-6">
            <strong>{course?.title}</strong> — {totalLessons} lessons across{' '}
            {course?.modules.length} modules. Saved as draft.
          </p>

          {/* Generate Videos */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-purple-900 mb-1">Generate lesson videos?</p>
            <p className="text-xs text-purple-700 mb-3">
              The video pipeline will create a branded MP4 for every lesson — narration, b-roll,
              intro/outro, captions. Requires ffmpeg (available in the container or locally).
            </p>
            {videoResult ? (
              <p className="text-sm font-medium">{videoResult}</p>
            ) : (
              <button
                onClick={generateVideos}
                disabled={generatingVideos}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
              >
                {generatingVideos ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Generating videos…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Generate Videos for All {totalLessons} Lessons
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/studio"
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium text-center"
            >
              Open Course Builder
            </Link>
            <button
              onClick={() => {
                setCourse(null);
                setStage('chat');
                setSavedCourseId(null);
                setVideoResult(null);
                setMessages([
                  {
                    role: 'assistant',
                    content: `Course saved! Want to build another one? Tell me what you need.`,
                  },
                ]);
              }}
              className="flex-1 border py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Build Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review state ───────────────────────────────────────────────────────────
  if (stage === 'review' && course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/courses" className="text-slate-400 hover:text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Review Generated Course</h1>
              <p className="text-xs text-slate-500">
                {totalLessons} lessons · {course.modules.length} modules · {course.duration_hours}h
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setStage('chat')}
              className="text-sm text-slate-500 hover:text-slate-700 border px-3 py-1.5 rounded-lg"
            >
              ← Back to chat
            </button>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 text-slate-700"
            >
              <option value="">No program (standalone)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              onClick={saveCourse}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
            >
              Save Course →
            </button>
          </div>
        </div>

        {saveError && (
          <div className="max-w-4xl mx-auto mt-4 px-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              ❌ {saveError}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Course header */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {course.category}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{course.title}</h2>
                <p className="text-slate-500 mt-1">{course.subtitle}</p>
                <p className="text-slate-600 mt-3 text-sm">{course.description}</p>
              </div>
              <div className="shrink-0 text-right text-sm text-slate-500 space-y-1">
                <p>
                  <span className="font-medium">{course.duration_hours}h</span> total
                </p>
                <p>
                  <span className="font-medium">{totalLessons}</span> lessons
                </p>
                <p>
                  <span className="font-medium">{course.passing_score}%</span> pass score
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">
                Audience
              </p>
              <p className="text-sm text-slate-700">{course.audience}</p>
            </div>
          </div>

          {/* Modules */}
          {course.modules.map((mod, mi) => (
            <div key={mi} className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b">
                <h3 className="font-semibold text-slate-900">
                  Module {mi + 1}: {mod.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{mod.lessons.length} lessons</p>
              </div>
              <div className="divide-y">
                {mod.lessons.map((lesson, li) => (
                  <div key={li} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {lesson.lesson_number}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{lesson.title}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{lesson.description}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 shrink-0 text-right">
                        <p>{lesson.duration_minutes} min</p>
                        <p>{lesson.quiz_questions?.length ?? 0} quiz Qs</p>
                      </div>
                    </div>
                    {lesson.content && (
                      <details className="mt-3">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                          Preview content
                        </summary>
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {lesson.content.slice(0, 600)}
                          {lesson.content.length > 600 ? '…' : ''}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pb-8">
            <button
              onClick={() => setStage('chat')}
              className="border px-5 py-2.5 rounded-lg hover:bg-slate-50 text-sm"
            >
              ← Revise with AI
            </button>
            <button
              onClick={saveCourse}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-semibold"
            >
              Save Course →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Saving state ───────────────────────────────────────────────────────────
  if (stage === 'saving') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-600 font-medium">Saving course to database…</p>
        </div>
      </div>
    );
  }

  // ── Chat state (default) ───────────────────────────────────────────────────
  return (
    <div className={`${embedded ? 'min-h-[720px] rounded-2xl border border-slate-200 overflow-hidden' : 'min-h-screen'} bg-slate-50 flex flex-col`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {!embedded && (
            <Link href="/admin/courses" className="text-slate-400 hover:text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-900">AI Course Builder</h1>
            <p className="text-xs text-slate-500">Describe your course — the AI will build it</p>
          </div>
        </div>
        {!embedded && (
          <div className="flex gap-2">
            <Link
              href="/admin/studio"
              className="text-xs text-slate-400 hover:text-slate-600 border px-3 py-1.5 rounded-lg"
            >
              Form builder →
            </Link>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-3 mt-1">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border text-slate-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content || (
                  <span className="flex gap-1 items-center text-slate-400">
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Starter prompts — only show at start */}
        {messages.length === 1 && !streaming && (
          <div className="mt-6 space-y-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">
              Quick starts
            </p>
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left text-sm bg-white border rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors text-slate-700"
              >
                {prompt}
              </button>
            ))}

            {/* Already-built courses */}
            <div className="mt-6">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">
                Already built — manage or view
              </p>
              <div className="space-y-2">
                {existingCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${course.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`} />
                      <span className="text-sm font-medium text-slate-800">{course.title}</span>
                      <span className="text-xs text-slate-400 capitalize">{course.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={course.manageUrl}
                        className="text-xs px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Manage
                      </Link>
                      <Link
                        href={course.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              rows={1}
              placeholder="Describe the course you want to build…"
              className="flex-1 resize-none border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 max-h-40 overflow-y-auto"
              style={{ minHeight: '48px' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 160) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="bg-blue-600 text-white w-11 h-11 rounded-xl hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center shrink-0"
            >
              {streaming ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
