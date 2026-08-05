"use client";

/**
 * @deprecated Use LmsPwaRegistration, MarketingPwaRegistration, or PortalPwaRegistration.
 * This file is kept for backward compatibility and will be removed after migration.
 * Now registers sw-admin.js instead of the root sw.js.
 */
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
          await navigator.serviceWorker.register("/sw-admin.js", {
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
