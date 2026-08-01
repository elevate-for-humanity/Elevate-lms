"use client";

import { useEffect } from "react";

const RELOAD_KEY = "elevate-chunk-reload";

function isChunkError(value: unknown): boolean {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : "";

  return (
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Application error")
  );
}

export function ChunkRecovery() {
  useEffect(() => {
    const reloadOnce = (error: unknown) => {
      if (!isChunkError(error)) return;

      if (sessionStorage.getItem(RELOAD_KEY) === "1") {
        sessionStorage.removeItem(RELOAD_KEY);
        return;
      }

      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    };

    const handleError = (event: ErrorEvent) => {
      reloadOnce(event.error || event.message);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      reloadOnce(event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    const timer = window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_KEY);
    }, 15000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
