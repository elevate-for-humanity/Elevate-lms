"use client";

import React from 'react';

import { useEffect, useRef, useState } from "react";

type Msg = {
  role: "student" | "assistant";
  content: string;
  created_at?: string;
  audioUrl?: string;
};

export function AIChatPanel(props: {
  programSlug: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");
    setMessages((m) => [...m, { role: "student", content: text }]);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programSlug: props.programSlug, message: text }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn't respond right now. Please try again, or contact support if urgent.",
        },
      ]);
      setSending(false);
      return;
    }

    const assistantMsg: Msg = {
      role: "assistant",
      content: data.reply ?? "Okay.",
      audioUrl: data.audioUrl
    };

    setMessages((m) => [...m, assistantMsg]);

    // Auto-play voice response if enabled
    if (voiceEnabled && data.audioUrl && audioRef.current) {
      audioRef.current.src = data.audioUrl;
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact first
      });
    }

    setSending(false);
  }

  function playAudio(audioUrl: string) {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-zinc-900">AI Instructor Chat</div>
            <div className="text-xs text-zinc-500">
              Ask questions about onboarding, coursework, and program requirements.
            </div>
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="text-xs px-3 py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition"
            title={voiceEnabled ? "Voice enabled" : "Voice disabled"}
          >
            {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />

      <div className="p-4 h-[360px] overflow-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-zinc-600">
            Ask me anything. Example: "What do I do first?" or "What's required this week?"
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={
              m.role === "student"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={
                m.role === "student"
                  ? "max-w-[80%] rounded-2xl bg-zinc-900 text-white px-4 py-2 text-sm"
                  : "max-w-[80%] rounded-2xl bg-zinc-100 text-zinc-900 px-4 py-2 text-sm"
              }
            >
              <div>{m.content}</div>
              {m.role === "assistant" && m.audioUrl && (
                <button
                  onClick={() => playAudio(m.audioUrl!)}
                  className="mt-2 text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                >
                  🔊 Play voice
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-zinc-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
          placeholder="Type your question…"
          className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
        />
        <button
          onClick={send}
          disabled={sending}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-white font-bold hover:bg-zinc-800 transition disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}
