"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useEffect, useState } from "react";

type Bookmark = {
  id: string;
  label: string | null;
  position_seconds: number;
  created_at: string;
};

type Note = {
  id: string;
  body: string;
  position_seconds: number | null;
  created_at: string;
};

type Answer = {
  id: string;
  body: string;
  created_at: string;
};

type Question = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  lesson_answers?: Answer[];
};

export function LessonSidebar({
  lessonId,
  getCurrentTime,
  seekTo,
}: {
  lessonId: string;
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load lesson sidebar data from DB
  useEffect(() => {
    async function loadSidebarData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load bookmarks
      const { data: bookmarkData } = await supabase
        .from('lesson_bookmarks')
        .select('id, label, position_seconds, created_at')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .order('position_seconds');
      if (bookmarkData) setBookmarks(bookmarkData);

      // Load notes
      const { data: noteData } = await supabase
        .from('lesson_notes')
        .select('id, body, position_seconds, created_at')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (noteData) setNotes(noteData);

      // Load questions
      const { data: questionData } = await supabase
        .from('lesson_questions')
        .select('id, title, body, created_at, lesson_answers (id, body, created_at)')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
      if (questionData) setQuestions(questionData);

      setLoading(false);
    }
    loadSidebarData();
  }, [lessonId, supabase]);

  // new note state
  const [noteBody, setNoteBody] = useState("");
  const [attachTime, setAttachTime] = useState(true);

  // new bookmark state
  const [bookmarkLabel, setBookmarkLabel] = useState("");

  // new question/answer state
  const [qaTab, setQaTab] = useState<"list" | "ask">("list");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [answerBody, setAnswerBody] = useState("");
  const [answerForQuestion, setAnswerForQuestion] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);
        const [bmRes, noteRes, qaRes] = await Promise.all([
          fetch(`/api/lessons/${lessonId}/bookmarks`, { cache: "no-store" }),
          fetch(`/api/lessons/${lessonId}/notes`, { cache: "no-store" }),
          fetch(`/api/lessons/${lessonId}/qa`, { cache: "no-store" }),
        ]);

        if (!cancelled) {
          if (bmRes.ok) {
            const json = await bmRes.json();
            setBookmarks(json.bookmarks || []);
          }
          if (noteRes.ok) {
            const json = await noteRes.json();
            setNotes(json.notes || []);
          }
          if (qaRes.ok) {
            const json = await qaRes.json();
            setQuestions(json.questions || []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const handleAddBookmark = async () => {
    const positionSeconds = getCurrentTime();
    if (Number.isNaN(positionSeconds)) return;

    const res = await fetch(`/api/lessons/${lessonId}/bookmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: bookmarkLabel || null,
        positionSeconds,
      }),
    });
    const json = await res.json();
    if (res.ok && json.bookmark) {
      setBookmarks((prev) =>
        [...prev, json.bookmark].sort(
          (a, b) => a.position_seconds - b.position_seconds
        )
      );
      setBookmarkLabel("");
    }
  };

  const handleAddNote = async () => {
    if (!noteBody.trim()) return;
    const positionSeconds = attachTime ? getCurrentTime() : null;

    const res = await fetch(`/api/lessons/${lessonId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: noteBody.trim(),
        positionSeconds,
      }),
    });
    const json = await res.json();
    if (res.ok && json.note) {
      setNotes((prev) => [json.note, ...prev]);
      setNoteBody("");
    }
  };

  const handleAskQuestion = async () => {
    if (!questionTitle.trim() || !questionBody.trim()) return;

    const res = await fetch(`/api/lessons/${lessonId}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "question",
        title: questionTitle.trim(),
        body: questionBody.trim(),
      }),
    });
    const json = await res.json();
    if (res.ok && json.question) {
      setQuestions((prev) => [json.question, ...prev]);
      setQuestionTitle("");
      setQuestionBody("");
      setQaTab("list");
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    if (!answerBody.trim()) return;

    const res = await fetch(`/api/lessons/${lessonId}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "answer",
        questionId,
        body: answerBody.trim(),
      }),
    });
    const json = await res.json();
    if (res.ok && json.answer) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                lesson_answers: [...(q.lesson_answers || []), json.answer],
              }
            : q
        )
      );
      setAnswerBody("");
      setAnswerForQuestion(null);
    }
  };

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const formatDate = (raw: string) =>
    new Date(raw).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-3 text-xs shadow-sm">
      {loading && (
        <p className="text-[11px] text-slate-500">Loading tools…</p>
      )}

      {/* BOOKMARKS */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold text-black">
          Bookmarks
        </h3>
        <div className="flex gap-2">
          <input
            value={bookmarkLabel}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBookmarkLabel(e.target.value)}
            placeholder="Label (optional)"
            className="flex-1 rounded border px-2 py-2 text-[11px]"
          />
          <button
            type="button"
            onClick={handleAddBookmark}
            className="rounded-full bg-brand-orange-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-brand-orange-700"
          >
            + Add
          </button>
        </div>
        {bookmarks.length ? (
          <ul className="mt-1 max-h-32 space-y-1.5 overflow-auto">
            {bookmarks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded bg-slate-50 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => seekTo(b.position_seconds)}
                  className="text-left text-[11px] text-blue-700 hover:underline"
                >
                  {b.label || "Bookmark"} • {formatTime(b.position_seconds)}
                </button>
                <span className="text-[10px] text-slate-500">
                  {formatDate(b.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-slate-500">
            Add bookmarks while you watch so you can jump back.
          </p>
        )}
      </section>

      {/* NOTES */}
      <section className="space-y-1.5 border-t pt-2">
        <h3 className="text-xs font-semibold text-black">Notes</h3>
        <textarea
          value={noteBody}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNoteBody(e.target.value)}
          placeholder="Write a note about this lesson…"
          className="h-16 w-full resize-none rounded border px-2 py-2 text-[11px]"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1 text-[11px] text-black">
            <input
              type="checkbox"
              checked={attachTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setAttachTime(e.target.checked)}
            />
            Attach current time
          </label>
          <button
            type="button"
            onClick={handleAddNote}
            className="rounded-full bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            Save note
          </button>
        </div>

        {notes.length ? (
          <ul className="mt-1 max-h-32 space-y-1.5 overflow-auto">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded bg-slate-50 px-2 py-2 text-[11px]"
              >
                <div className="flex items-center justify-between">
                  {typeof n.position_seconds === "number" ? (
                    <button
                      type="button"
                      onClick={() => seekTo(n.position_seconds!)}
                      className="text-blue-700 hover:underline"
                    >
                      {formatTime(n.position_seconds!)}
                    </button>
                  ) : (
                    <span className="text-slate-500">Note</span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {formatDate(n.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-black">{n.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-slate-500">
            Keep all your key takeaways in one place.
          </p>
        )}
      </section>

      {/* Q&A */}
      <section className="space-y-1.5 border-t pt-2">
        <div className="flex items-center justify-between text-[11px]">
          <h3 className="font-semibold text-black">
            Lesson Q&amp;A
          </h3>
          <div className="flex gap-1 rounded-full bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setQaTab("list")}
              className={`rounded-full px-2 py-0.5 ${
                qaTab === "list"
                  ? "bg-white text-black shadow"
                  : "text-black"
              }`}
            >
              Questions
            </button>
            <button
              type="button"
              onClick={() => setQaTab("ask")}
              className={`rounded-full px-2 py-0.5 ${
                qaTab === "ask"
                  ? "bg-white text-black shadow"
                  : "text-black"
              }`}
            >
              Ask
            </button>
          </div>
        </div>

        {qaTab === "ask" ? (
          <div className="space-y-1.5 rounded-lg bg-slate-50 p-2">
            <input
              value={questionTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuestionTitle(e.target.value)}
              placeholder="Short question title"
              className="w-full rounded border px-2 py-2 text-[11px]"
            />
            <textarea
              value={questionBody}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuestionBody(e.target.value)}
              placeholder="Describe your question…"
              className="h-16 w-full resize-none rounded border px-2 py-2 text-[11px]"
            />
            <button
              type="button"
              onClick={handleAskQuestion}
              className="w-full rounded-full bg-brand-orange-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-brand-orange-700"
            >
              Post question
            </button>
          </div>
        ) : (
          <div className="space-y-1 max-h-40 overflow-auto">
            {questions.length ? (
              questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg bg-slate-50 p-2 text-[11px]"
                >
                  <p className="font-semibold text-black">
                    {q.title}
                  </p>
                  <p className="text-black">{q.body}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {formatDate(q.created_at)}
                  </p>

                  {/* Answers */}
                  {q.lesson_answers && q.lesson_answers.length > 0 && (
                    <ul className="mt-1 space-y-0.5 border-l pl-2">
                      {q.lesson_answers.map((a) => (
                        <li key={a.id} className="text-black">
                          {a.body}
                          <span className="ml-1 text-[10px] text-slate-500">
                            ({formatDate(a.created_at)})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Answer form toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setAnswerForQuestion(
                        answerForQuestion === q.id ? null : q.id
                      )
                    }
                    className="mt-1 text-[10px] font-semibold text-blue-700 hover:underline"
                  >
                    {answerForQuestion === q.id
                      ? "Cancel"
                      : "Reply to this question"}
                  </button>

                  {answerForQuestion === q.id && (
                    <div className="mt-1 space-y-1">
                      <textarea
                        value={answerBody}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setAnswerBody(e.target.value)}
                        placeholder="Type your answer…"
                        className="h-12 w-full resize-none rounded border px-2 py-2 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAnswerQuestion(q.id)}
                        className="rounded-full bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-700"
                      >
                        Post answer
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-500">
                No questions yet. Be the first to ask about this lesson.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
