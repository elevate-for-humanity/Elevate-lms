"use client";

import { useEffect } from "react";

const ADMIN_SW_URL = "/sw-admin.js";
const ADMIN_SW_SCOPE = "/";

async function removeStaleAdminWorker() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => registration.scope === `${window.location.origin}/`)
        .map((registration) => registration.unregister()),
    );

    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("elevate-admin-"))
          .map((name) => caches.delete(name)),
      );
    }
  } catch {
    // Cleanup is best-effort. Do not break the admin UI if browser storage APIs fail.
  }
}

export function AdminPwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      try {
        // Verify the worker is actually being served before asking the browser to
        // register it. This avoids a noisy registration exception during deploys
        // and lets us clean up an older worker that may cache stale RSC responses.
        const probe = await fetch(ADMIN_SW_URL, {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!probe.ok) {
          await removeStaleAdminWorker();
          return;
        }

        if (cancelled) return;

        const registration = await navigator.serviceWorker.register(ADMIN_SW_URL, {
          scope: ADMIN_SW_SCOPE,
          updateViaCache: "none",
        });

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(
                new CustomEvent("elevate-pwa-update-ready", {
                  detail: registration,
                }),
              );
            }
          });
        });
      } catch (error) {
        // A deploy or temporary network outage should not break the admin shell.
        // Remove stale admin workers and allow normal network navigation.
        await removeStaleAdminWorker();
        if (process.env.NODE_ENV !== "production") {
          console.warn("[pwa] Admin service worker unavailable", error);
        }
      }
    };

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
