"use client";

import React from 'react';

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

export function ElevateChatWidget() {
  const [open, setOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if user has already interacted with chat
    const interacted = localStorage.getItem('elevate-chat-interacted');
    if (interacted) {
      setHasInteracted(true);
      return undefined;
    }

    // Show prompt after 3 seconds on first visit
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setShowPrompt(false);
    setHasInteracted(true);
    localStorage.setItem('elevate-chat-interacted', 'true');
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    setHasInteracted(true);
    localStorage.setItem('elevate-chat-interacted', 'true');
  };

  return (
    <>
      {/* Proactive chat prompt */}
      {showPrompt && !open && !hasInteracted && (
        <div className="fixed bottom-24 right-6 z-50 w-80 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div className="text-white">
                  <div className="text-sm font-semibold">Need help?</div>
                  <div className="text-xs opacity-90">We're here for you</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissPrompt}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-black mb-3 font-semibold">
                👋 Welcome to Elevate For Humanity!
              </p>
              <p className="text-sm text-black mb-3">
                I can help you with:
              </p>
              <ul className="text-xs text-black space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Finding 100% FREE training programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Checking your funding eligibility (WIOA, WRG)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Starting your application</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Answering questions about programs</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={handleOpen}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Chat With Us Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xl hover:scale-110 hover:shadow-emerald-500/50 transition-all flex items-center justify-center group"
          title="Chat with Elevate - Get Help Now!"
          aria-label="Open chat assistant"
        >
          <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
          {!hasInteracted && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center gap-3">
                <MessageCircle size={24} />
                <div>
                  <div className="text-sm font-semibold">
                    Elevate AI Helper
                  </div>
                  <div className="text-xs opacity-90">
                    Ask me anything about our programs
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
            <iframe
              src="/ai-chat"
              className="flex-1 w-full border-0"
              title="Elevate AI Chat"
            />
          </div>
        </div>
      )}
    </>
  );
}
