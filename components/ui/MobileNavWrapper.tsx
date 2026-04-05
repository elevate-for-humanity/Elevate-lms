"use client";

import React from 'react';

import { useEffect } from "react";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Production-grade mobile navigation wrapper
 *
 * Features:
 * - Proper scroll lock without page jump
 * - Restores scroll position on close
 * - ESC key to close
 * - Accessible (role="dialog", aria-modal)
 * - Scrollable panel content
 * - Backdrop click to close
 *
 * Usage:
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <MobileNavWrapper open={open} onClose={() => setOpen(false)}>
 *   <nav>Your menu items here</nav>
 * </MobileNavWrapper>
 * ```
 */
export function MobileNavWrapper({ open, onClose, children }: MobileNavProps) {
  // Lock/unlock body scroll properly (and ALWAYS restore on unmount)
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const body = document.body;

    // Lock body in place without jumping
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      // Restore
      const top = body.style.top;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";

      // Return to where user was
      const y = top ? parseInt(top.replace("-", "").replace("px", ""), 10) : 0;
      window.scrollTo(0, y);
    };
  }, [open]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Menu</div>
          <button
            className="rounded-lg px-3 py-2 border hover:bg-gray-50 transition-colors"
            onClick={onClose}
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        {/* IMPORTANT: panel must be scrollable */}
        <div className="h-[calc(100%-57px)] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
