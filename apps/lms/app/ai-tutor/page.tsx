'use client';

import Link from 'next/link';
import { Brain, BookOpen, MessageSquare } from 'lucide-react';
import { AITutorWidget } from '@/components/ai/AITutorWidget';

export default function AITutorPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
              <Brain className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-950">AI Tutor</h1>
              <p className="mt-2 max-w-2xl text-slate-700">
                Ask questions, review concepts, and get step-by-step learning support. Course-specific tutoring is also available inside assigned courses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <MessageSquare className="h-6 w-6 text-violet-700" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">Start a tutoring session</h2>
          <p className="mt-2 text-sm text-slate-700">
            Use the AI Tutor button in the lower-right corner to open a general learning-support session.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <BookOpen className="h-6 w-6 text-violet-700" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">Use course context</h2>
          <p className="mt-2 text-sm text-slate-700">
            For the most relevant answers, open your assigned course and use its tutor so the assistant receives the correct course context.
          </p>
          <Link href="/lms/courses" className="mt-4 inline-flex font-semibold text-violet-700 hover:text-violet-800">
            Go to my courses
          </Link>
        </div>
      </section>

      <AITutorWidget courseId="general-learning-support" courseName="General Learning Support" />
    </main>
  );
}
