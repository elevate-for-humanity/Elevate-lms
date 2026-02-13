"use client";

import React from 'react';


import { useState, useRef, useEffect } from "react";


interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! 👋 I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm having trouble connecting. Please visit /contact or /faq for help, or try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Tell me about programs",
    "How do I apply?",
    "Talk to someone",
    "What's the cost?",
  ];

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-700 transition-all hover:scale-110"
          aria-label="Open chat"
        >
          <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-brand-orange-500 text-[10px] sm:text-xs font-bold">
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 flex h-[80vh] md:h-[600px] w-full md:w-[400px] flex-col md:rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-blue-100">Online • Instant replies</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 hover:bg-white/20 transition"
              aria-label="Close chat"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-black"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(action)}
                    className="text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs text-black">
              Need more help? <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
