"use client";

import { useEffect, useMemo, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export function AdminInstallButton() {
  const [promptEvent, setPromptEvent] =
    useState<InstallPromptEvent | null>(null);

  const [installed, setInstalled] =
    useState(false);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return /iphone|ipad|ipod/i.test(
      navigator.userAgent,
    );
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia(
        "(display-mode: standalone)",
      ).matches ||
      Boolean(
        (
          navigator as Navigator & {
            standalone?: boolean;
          }
        ).standalone,
      );

    setInstalled(standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(
        event as InstallPromptEvent,
      );
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onPrompt,
    );

    window.addEventListener(
      "appinstalled",
      onInstalled,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onPrompt,
      );

      window.removeEventListener(
        "appinstalled",
        onInstalled,
      );
    };
  }, []);

  const install = async () => {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (installed) {
    return (
      <div className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900">
        Elevate Admin is installed.
      </div>
    );
  }

  if (promptEvent) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
      >
        Install Elevate Admin
      </button>
    );
  }

  if (isIOS) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
        On iPhone or iPad, open this page in
        Safari, select Share, and then select
        Add to Home Screen.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
      Open this page in Chrome or Microsoft
      Edge. The Install option will appear after
      the browser confirms the application is
      installable.
    </div>
  );
}
