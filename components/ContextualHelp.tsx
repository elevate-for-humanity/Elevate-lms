"use client";

import React from 'react';
import Image from 'next/image';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';

interface ContextualHelpProps {
  title: string;
  content: string;
  learnMoreUrl?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export function ContextualHelp({
  title,
  content,
  learnMoreUrl,
  position = 'top',
  size = 'md',
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const sizeClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
  };

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-brand-blue-600 transition-colors"
        aria-label="Help"
        type="button"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${sizeClasses[size]} ${positionClasses[position]}`}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-black text-sm">
                {title}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-black leading-relaxed mb-3">
              {content}
            </p>

            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
              >
                Learn more
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-white border-gray-200 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r'
                : position === 'bottom'
                ? 'top-[-6px] left-1/2 -translate-x-1/2 border-t border-l'
                : position === 'left'
                ? 'right-[-6px] top-1/2 -translate-y-1/2 border-r border-t'
                : 'left-[-6px] top-1/2 -translate-y-1/2 border-l border-b'
            }`}
          />
        </div>
      )}
    </div>
  );
}

// Inline help text component
export function InlineHelp({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-500 mt-1 flex items-start gap-1">
      <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </p>
  );
}

// Help section component for forms
export function HelpSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
        type="button"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-blue-600" />
          <span className="font-medium text-brand-blue-900">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-brand-blue-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 text-sm text-brand-blue-800 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// Quick tips component
export function QuickTips({ tips }: { tips: string[] }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">💡</span>
        <h4 className="font-semibold text-amber-900">Quick Tips</h4>
      </div>
      <ul className="space-y-2 ml-7">
        {tips.map((tip, index) => (
          <li key={index} className="text-sm text-amber-800">
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Keyboard shortcuts help
export function KeyboardShortcuts({
  shortcuts,
}: {
  shortcuts: Array<{ keys: string[]; description: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-black hover:text-black flex items-center gap-1"
        type="button"
      >
        <span className="font-mono text-xs bg-gray-100 px-2 py-2 rounded">?</span>
        Keyboard Shortcuts
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-black">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-black">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-gray-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Feature announcement component
export function FeatureAnnouncement({
  title,
  description,
  imageUrl,
  ctaText,
  ctaUrl,
  onDismiss,
}: {
  title: string;
  description: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  onDismiss: () => void;
}) {
  return (
    <div className="   rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <h3 className="text-xl font-bold">New Feature!</h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {imageUrl && (
        <div className="relative w-full h-48 mb-4">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      )}

      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-purple-100 mb-4">{description}</p>

      {ctaText && ctaUrl && (
        <a
          href={ctaUrl}
          className="inline-flex items-center gap-2 px-6 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
        >
          {ctaText}
          <ChevronRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
