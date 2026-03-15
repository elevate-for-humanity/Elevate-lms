"use client";

import React from 'react';

import { useEffect, useState } from "react";

interface ContentProtectionProps {
  children: React.ReactNode;
  showWarning?: boolean;
}

/**
 * Content Protection Component
 * - Disables right-click
 * - Prevents text selection on sensitive content
 * - Blocks common keyboard shortcuts for copying
 * - Shows warning message when protection is triggered
 */
export function ContentProtection({
  children,
  showWarning = true,
}: ContentProtectionProps) {
  const [warningVisible, setWarningVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+X, Ctrl+S, Ctrl+P, F12, Ctrl+Shift+I
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "x" || e.key === "s" || e.key === "p")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        if (showWarning) {
          setWarningVisible(true);
          setTimeout(() => setWarningVisible(false), 3000);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (showWarning) {
        setWarningVisible(true);
        setTimeout(() => setWarningVisible(false), 3000);
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (showWarning) {
        setWarningVisible(true);
        setTimeout(() => setWarningVisible(false), 3000);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
    };
  }, [showWarning]);

  return (
    <div className="relative">
      <div className="select-none">{children}</div>

      {/* Warning Toast */}
      {warningVisible && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up">
          <div className="rounded-lg bg-white px-6 py-4 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <svg
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-semibold">Content Protected</p>
                <p className="text-sm">
                  © Elevate for Humanity - All Rights Reserved
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
