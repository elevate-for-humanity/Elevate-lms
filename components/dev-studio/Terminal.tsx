"use client";

import React from 'react';

import { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';

interface TerminalProps {
  output: string[];
  onClear?: () => void;
}

export default function Terminal({ output, onClear }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Au to bottom when new output arrives
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-full flex flex-col bg-black text-brand-green-400 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="text-white font-semibold">Terminal</span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-white transition-colors"
            title="Clear terminal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 space-y-1"
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            $ Ready. Run commands or save files to see output here...
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap break-words">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
