"use client";

import React from 'react';

import { useState, useRef, useEffect } from "react";
import type { ProgramInstructorProfile } from "@/lms-data/instructors";

type Sender = "student" | "instructor";

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
}

interface AIInstructorPanelProps {
  instructor: ProgramInstructorProfile;
  programTitle: string;
}

export function AIInstructorPanel({ instructor, programTitle }: AIInstructorPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "instructor",
      text: `Hi, I'm ${instructor.shortName}, your AI instructor for the ${programTitle} program. You can ask me questions about the coursework, expectations, and how to succeed in this pathway. I cannot give medical, legal, or HR advice, but I can help you understand the learning content and workplace expectations.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "student",
      text: userText,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: instructor.programId,
          instructorId: instructor.id,
          history: messages.map((m) => ({
            role: m.sender === "student" ? "user" : "assistant",
            content: m.text,
          })),
          latest: userText,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Unable to reach AI instructor.");
      }

      const data = await res.json();
      const replyText: string =
        typeof data.text === "string"
          ? data.text
          : "I'm here to help you understand the program. Please try your question again.";

      const instructorMsg: ChatMessage = {
        id: `instr-${Date.now()}`,
        sender: "instructor",
        text: replyText,
      };
      setMessages((prev) => [...prev, instructorMsg]);
    } catch (err: any) {
      // Error logged
      setError(
        err?.message ||
          "Something went wrong contacting the AI instructor. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[480px] flex-col rounded-xl border border-slate-800 bg-slate-950/80 text-xs">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-base">
          {instructor.avatarEmoji || "🎓"}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-100">
            {instructor.name}
          </p>
          <p className="text-[10px] text-slate-400">
            {instructor.title}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              "max-w-[80%] rounded-lg px-3 py-2 text-[11px] " +
              (m.sender === "student"
                ? "ml-auto bg-brand-orange-600 text-white"
                : "mr-auto bg-slate-800 text-slate-100")
            }
          >
            <p className="whitespace-pre-wrap">{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 bg-slate-950 px-3 py-2">
        {error && (
          <p className="mb-1 text-[10px] text-brand-red-400">
            {error}
          </p>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder={`Ask ${instructor.shortName} a question about ${programTitle}...`}
            className="h-8 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 text-[11px] text-slate-100 Content:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-red-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-8 rounded-md bg-brand-orange-600 px-3 text-[11px] font-semibold text-white hover:bg-brand-orange-700 disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </form>
        <p className="mt-1 text-[9px] text-slate-500">
          AI instructor responses are for learning and guidance only. Always
          follow your program handbook, licensed instructors, and workplace
          policies.
        </p>
      </div>
    </div>
  );
}
