'use client';

import { useState } from 'react';
import { HelpCircle, Pencil, Plus, Settings, Trash2, X } from 'lucide-react';
import { useCourse } from '../CourseProvider';
import { PanelHeader } from './BlueprintPanel';

type Quiz = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  created_at: string;
  question_count?: number;
};

type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options: unknown;
  correct_answer: string;
  points: number;
  order_index: number;
};

type QuizForm = {
  title: string;
  description: string;
  time_limit_minutes: string;
  passing_score: string;
  max_attempts: string;
};

type QuestionForm = {
  question_text: string;
  question_type: string;
  options: string;
  correct_answer: string;
  points: string;
};

const EMPTY_QUIZ: QuizForm = {
  title: '',
  description: '',
  time_limit_minutes: '',
  passing_score: '70',
  max_attempts: '3',
};

const EMPTY_QUESTION: QuestionForm = {
  question_text: '',
  question_type: 'multiple_choice',
  options: '',
  correct_answer: '',
  points: '1',
};

function optionsToText(options: unknown): string {
  if (Array.isArray(options)) return options.map(String).join('\n');
  if (typeof options === 'string') return options;
  return '';
}

function textToOptions(text: string, questionType: string): string[] | null {
  if (questionType === 'short_answer') return null;
  if (questionType === 'true_false') return ['True', 'False'];
  return text.split('\n').map((value) => value.trim()).filter(Boolean);
}

export function QuizPanel() {
  const { state, appendAIMemory } = useCourse();
  const { course } = state;
  const [quizzes, setQuizzes] = useState<Quiz[]>(
    state.quizzes.map((value) => {
      const quiz = value as typeof value & { max_attempts?: number | null; created_at?: string | null; question_count?: number | null };
      return {
        id: quiz.id,
        course_id: quiz.course_id,
        title: quiz.title,
        description: quiz.description,
        time_limit_minutes: quiz.time_limit_minutes,
        passing_score: quiz.passing_score ?? 70,
        max_attempts: quiz.max_attempts ?? 3,
        created_at: quiz.created_at ?? new Date(0).toISOString(),
        question_count: quiz.question_count ?? 0,
      };
    }),
  );
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>(EMPTY_QUIZ);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(EMPTY_QUESTION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizForm(EMPTY_QUIZ);
    setError(null);
    setQuizModalOpen(true);
  };

  const openEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description ?? '',
      time_limit_minutes: quiz.time_limit_minutes?.toString() ?? '',
      passing_score: quiz.passing_score.toString(),
      max_attempts: quiz.max_attempts.toString(),
    });
    setError(null);
    setQuizModalOpen(true);
  };

  const saveQuiz = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...(editingQuiz ? { id: editingQuiz.id } : {}),
        course_id: course.id,
        title: quizForm.title.trim(),
        description: quizForm.description || null,
        time_limit_minutes: quizForm.time_limit_minutes ? Number.parseInt(quizForm.time_limit_minutes, 10) : null,
        passing_score: Number.parseInt(quizForm.passing_score, 10) || 70,
        max_attempts: Number.parseInt(quizForm.max_attempts, 10) || 3,
      };
      const response = await fetch('/api/admin/courses/quizzes', {
        method: editingQuiz ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to save quiz');
      const saved = body.data as Quiz;
      setQuizzes((current) => editingQuiz
        ? current.map((quiz) => quiz.id === saved.id ? { ...quiz, ...saved } : quiz)
        : [{ ...saved, question_count: 0 }, ...current]);
      appendAIMemory({ role: 'action', content: `Quiz saved: "${saved.title}" (passing: ${saved.passing_score}%)`, source: 'quiz' });
      setQuizModalOpen(false);
      setEditingQuiz(null);
      setQuizForm(EMPTY_QUIZ);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save quiz');
    } finally {
      setBusy(false);
    }
  };

  const deleteQuiz = async (quiz: Quiz) => {
    if (!window.confirm(`Delete "${quiz.title}" and its questions?`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses/quizzes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quiz.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to delete quiz');
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id));
      if (selectedQuiz?.id === quiz.id) {
        setSelectedQuiz(null);
        setQuestions([]);
      }
      appendAIMemory({ role: 'action', content: `Quiz deleted: ${quiz.id}`, source: 'quiz' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to delete quiz');
    } finally {
      setBusy(false);
    }
  };

  const loadQuestions = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuestionsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses/quiz-questions?quizId=${encodeURIComponent(quiz.id)}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to load quiz questions');
      setQuestions((body.data ?? []) as Question[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load quiz questions');
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm(EMPTY_QUESTION);
    setQuestionModalOpen(true);
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: optionsToText(question.options),
      correct_answer: question.correct_answer ?? '',
      points: String(question.points ?? 1),
    });
    setQuestionModalOpen(true);
  };

  const saveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedQuiz) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...(editingQuestion ? { id: editingQuestion.id } : {}),
        quiz_id: selectedQuiz.id,
        question_text: questionForm.question_text.trim(),
        question_type: questionForm.question_type,
        options: textToOptions(questionForm.options, questionForm.question_type),
        correct_answer: questionForm.correct_answer,
        points: Number.parseInt(questionForm.points, 10) || 1,
        order_index: editingQuestion?.order_index ?? questions.length,
      };
      const response = await fetch('/api/admin/courses/quiz-questions', {
        method: editingQuestion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to save quiz question');
      const saved = body.data as Question;
      setQuestions((current) => editingQuestion
        ? current.map((question) => question.id === saved.id ? saved : question)
        : [...current, saved]);
      setQuizzes((current) => current.map((quiz) => quiz.id === selectedQuiz.id
        ? { ...quiz, question_count: editingQuestion ? (quiz.question_count ?? questions.length) : (quiz.question_count ?? questions.length) + 1 }
        : quiz));
      setQuestionModalOpen(false);
      setEditingQuestion(null);
      setQuestionForm(EMPTY_QUESTION);
      appendAIMemory({ role: 'action', content: `Quiz question saved for "${selectedQuiz.title}"`, source: 'quiz' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save quiz question');
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (question: Question) => {
    if (!window.confirm('Delete this quiz question?')) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses/quiz-questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: question.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Failed to delete quiz question');
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      if (selectedQuiz) {
        setQuizzes((current) => current.map((quiz) => quiz.id === selectedQuiz.id
          ? { ...quiz, question_count: Math.max(0, (quiz.question_count ?? questions.length) - 1) }
          : quiz));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to delete quiz question');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6">
      <PanelHeader
        icon={<HelpCircle className="h-5 w-5" />}
        title="Quizzes & Assessments"
        subtitle={`${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'}`}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Create assessments, configure passing rules, and manage questions without leaving Course Builder.</p>
        <button type="button" onClick={openCreateQuiz} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700"><Plus className="h-4 w-4" />Create Quiz</button>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quizzes.map((quiz) => (
          <article key={quiz.id} className={`rounded-xl border bg-white p-5 shadow-sm ${selectedQuiz?.id === quiz.id ? 'border-brand-blue-400 ring-2 ring-brand-blue-100' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-bold text-slate-900">{quiz.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{quiz.description || 'No description'}</p></div>
              <button type="button" onClick={() => deleteQuiz(quiz)} disabled={busy} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${quiz.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-base text-slate-900">{quiz.passing_score}%</strong>Pass</div>
              <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-base text-slate-900">{quiz.max_attempts}</strong>Attempts</div>
              <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-base text-slate-900">{quiz.question_count ?? 0}</strong>Questions</div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => loadQuestions(quiz)} className="flex-1 rounded-lg bg-brand-blue-50 px-3 py-2 text-sm font-bold text-brand-blue-700 hover:bg-brand-blue-100">Questions</button>
              <button type="button" onClick={() => openEditQuiz(quiz)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label={`Settings for ${quiz.title}`}><Settings className="h-4 w-4" /></button>
            </div>
          </article>
        ))}
        {!quizzes.length ? <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No quizzes yet. Create the first assessment.</div> : null}
      </div>

      {selectedQuiz ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-bold text-slate-900">{selectedQuiz.title} · Questions</h3><p className="text-sm text-slate-500">Manage the question bank for this assessment.</p></div>
            <div className="flex gap-2"><button type="button" onClick={openCreateQuestion} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Add Question</button><button type="button" onClick={() => { setSelectedQuiz(null); setQuestions([]); }} className="rounded-lg border border-slate-200 p-2 text-slate-600"><X className="h-4 w-4" /></button></div>
          </div>
          {questionsLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading questions…</p> : (
            <div className="space-y-2">
              {questions.map((question, index) => (
                <div key={question.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">{index + 1}</span>
                  <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{question.question_text}</p><p className="mt-1 text-xs text-slate-500">{question.question_type.replaceAll('_', ' ')} · {question.points ?? 1} point{question.points === 1 ? '' : 's'} · answer: {question.correct_answer || 'not set'}</p></div>
                  <button type="button" onClick={() => openEditQuestion(question)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-50" aria-label="Edit question"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => deleteQuestion(question)} disabled={busy} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50" aria-label="Delete question"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {!questions.length ? <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">No questions yet.</div> : null}
            </div>
          )}
        </section>
      ) : null}

      {quizModalOpen ? (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><h3 className="text-lg font-bold">{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</h3><button type="button" onClick={() => setQuizModalOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <form onSubmit={saveQuiz} className="space-y-4 p-6">
              <label className="block text-sm font-semibold text-slate-700">Title<input required value={quizForm.title} onChange={(event) => setQuizForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-semibold text-slate-700">Description<textarea rows={3} value={quizForm.description} onChange={(event) => setQuizForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold text-slate-700">Passing score<input type="number" min="0" max="100" value={quizForm.passing_score} onChange={(event) => setQuizForm((current) => ({ ...current, passing_score: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-semibold text-slate-700">Max attempts<input type="number" min="1" value={quizForm.max_attempts} onChange={(event) => setQuizForm((current) => ({ ...current, max_attempts: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div>
              <label className="block text-sm font-semibold text-slate-700">Time limit (minutes)<input type="number" min="0" value={quizForm.time_limit_minutes} onChange={(event) => setQuizForm((current) => ({ ...current, time_limit_minutes: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setQuizModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button type="submit" disabled={busy} className="rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {questionModalOpen && selectedQuiz ? (
        <div className="fixed inset-0 z-[12010] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><h3 className="text-lg font-bold">{editingQuestion ? 'Edit Question' : 'Add Question'}</h3><button type="button" onClick={() => setQuestionModalOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <form onSubmit={saveQuestion} className="space-y-4 p-6">
              <label className="block text-sm font-semibold text-slate-700">Question<textarea required rows={3} value={questionForm.question_text} onChange={(event) => setQuestionForm((current) => ({ ...current, question_text: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-semibold text-slate-700">Type<select value={questionForm.question_type} onChange={(event) => setQuestionForm((current) => ({ ...current, question_type: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="multiple_choice">Multiple choice</option><option value="true_false">True / False</option><option value="short_answer">Short answer</option></select></label>
              {questionForm.question_type === 'multiple_choice' ? <label className="block text-sm font-semibold text-slate-700">Options (one per line)<textarea rows={5} value={questionForm.options} onChange={(event) => setQuestionForm((current) => ({ ...current, options: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label> : null}
              <label className="block text-sm font-semibold text-slate-700">Correct answer<input required value={questionForm.correct_answer} onChange={(event) => setQuestionForm((current) => ({ ...current, correct_answer: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-semibold text-slate-700">Points<input type="number" min="1" value={questionForm.points} onChange={(event) => setQuestionForm((current) => ({ ...current, points: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setQuestionModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button type="submit" disabled={busy} className="rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editingQuestion ? 'Update Question' : 'Add Question'}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
