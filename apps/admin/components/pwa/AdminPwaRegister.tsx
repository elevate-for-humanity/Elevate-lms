"use client";

import { useEffect } from "react";

export function AdminPwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const register = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

        registration.addEventListener(
          "updatefound",
          () => {
            const worker = registration.installing;

            worker?.addEventListener(
              "statechange",
              () => {
                if (
                  worker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  window.dispatchEvent(
                    new CustomEvent(
                      "elevate-pwa-update-ready",
                      {
                        detail: registration,
                      },
                    ),
                  );
                }
              },
            );
          },
        );
      } catch (error) {
        console.error(
          "[pwa] Service-worker registration failed",
          error,
        );
      }
    };

    void register();
  }, []);

  return null;
}
