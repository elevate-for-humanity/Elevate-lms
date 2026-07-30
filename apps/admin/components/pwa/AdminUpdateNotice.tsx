"use client";

import { useEffect, useState } from "react";

export function AdminUpdateNotice() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(
      null,
    );

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const customEvent =
        event as CustomEvent<ServiceWorkerRegistration>;

      setRegistration(customEvent.detail);
    };

    window.addEventListener(
      "elevate-pwa-update-ready",
      onUpdate,
    );

    return () => {
      window.removeEventListener(
        "elevate-pwa-update-ready",
        onUpdate,
      );
    };
  }, []);

  if (!registration) {
    return null;
  }

  const update = () => {
    registration.waiting?.postMessage({
      type: "SKIP_WAITING",
    });

    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-blue-200 bg-white p-4 shadow-xl">
      <p className="font-bold text-slate-950">
        A new Admin version is available.
      </p>

      <p className="mt-1 text-sm text-slate-600">
        Reload to use the newest dashboard.
      </p>

      <button
        type="button"
        onClick={update}
        className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white"
      >
        Update now
      </button>
    </div>
  );
}
