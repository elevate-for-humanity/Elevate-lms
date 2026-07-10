'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';

// Dynamically import ParisChat to avoid SSR issues
const ParisChat = dynamic(() => import('./ParisChat'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-brand-red-600 border-t-transparent rounded-full" />
    </div>
  ),
});

export function ParisFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 flex items-center gap-2 pr-5"
        aria-label="Open PARIS AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold text-sm hidden sm:inline">PARIS</span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Window */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-brand-red-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold">PARIS AI</h3>
                <p className="text-xs text-red-100">Your AI Career Assistant</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white text-2xl leading-none"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <ParisChat />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ParisFloatingButton;
