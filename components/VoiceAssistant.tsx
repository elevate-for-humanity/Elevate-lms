'use client';

import React from 'react';

import { useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { MessageCircle, X, Mic } from 'lucide-react';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    {
      text: "Hi! I'm your voice assistant. Click the microphone and say commands like 'go to dashboard' or 'show my courses'. Say 'help' to see all commands.",
      isUser: false,
    },
  ]);

  const handleCommand = (command: string) => {
    setMessages((prev) => [
      ...prev,
      { text: command, isUser: true },
      { text: 'Processing your command...', isUser: false },
    ]);
  };

  const voiceCommands = [
    { command: 'go to dashboard', description: 'Open your dashboard' },
    { command: 'show my courses', description: 'View your enrolled courses' },
    { command: 'show programs', description: 'Browse available programs' },
    { command: 'my certificates', description: 'View your certificates' },
    { command: 'my progress', description: 'Check your progress' },
    { command: 'show messages', description: 'Open messages' },
    { command: 'my profile', description: 'View your profile' },
    { command: 'enroll now', description: 'Start enrollment' },
    { command: 'help', description: 'Show available commands' },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14    text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
        title="Voice Assistant"
      >
        {isOpen ? (
          <X className="h-10 w-10" />
        ) : (
          <Mic className="h-10 w-10 group-hover:scale-110 transition-transform" />
        )}
      </button>
      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="   text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">Voice Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-4/5 rounded-2xl px-4 py-2 ${
                    message.isUser
                      ? 'bg-brand-orange-600 text-white'
                      : 'bg-white text-black border border-slate-200'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Voice Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <VoiceInput onCommand={handleCommand} />
              <p className="text-xs text-slate-700 text-center">
                Click the microphone and speak your command
              </p>
            </div>
          </div>
          {/* Quick Commands */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-black mb-2">Try these commands:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {voiceCommands.slice(0, 5).map((cmd, index) => (
                <div key={index} className="text-xs text-black flex items-start gap-2">
                  <span className="text-brand-orange-600">•</span>
                  <span>
                    <strong>"{cmd.command}"</strong> - {cmd.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
