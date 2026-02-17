"use client";

import React from 'react';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

type ContextualHelpProps = {
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
};

export function ContextualHelp({ title, content, position = 'top' }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-slate-100 rounded-full transition"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4 text-slate-400 hover:text-brand-blue-600 transition" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Tooltip */}
          <div
            className={`absolute z-50 w-72 ${positionClasses[position]} animate-in fade-in zoom-in duration-200`}
          >
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-black text-sm">{title}</h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 hover:bg-slate-100 rounded transition"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-black leading-relaxed">{content}</p>
            </div>
            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-white border-slate-200 transform rotate-45 ${
                position === 'top'
                  ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-b border-r'
                  : position === 'bottom'
                  ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-l'
                  : position === 'left'
                  ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-r border-t'
                  : 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-l border-b'
              }`}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Inline help text component
export function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
      <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </p>
  );
}

// Help banner for important information
export function HelpBanner({
  title,
  children,
  type = 'info'
}: {
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
}) {
  const styles = {
    info: 'bg-brand-blue-50 border-brand-blue-200 text-brand-blue-900',
    warning: 'bg-brand-orange-50 border-brand-orange-200 text-brand-orange-900',
    success: 'bg-brand-green-50 border-brand-green-200 text-brand-green-900',
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[type]}`}>
      <div className="flex gap-3">
        <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold mb-1">{title}</h4>
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}
