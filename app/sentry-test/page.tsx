"use client";

import * as Sentry from "@sentry/nextjs";



export default function SentryTestPage() {
  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>This page is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Sentry Test Page</h1>
      <p className="text-gray-600 max-w-md text-center">
        Use these buttons to test Sentry error tracking. Errors will be captured
        and sent to your Sentry dashboard if NEXT_PUBLIC_SENTRY_DSN is configured.
      </p>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            throw new Error("Sentry Frontend Test Error - Thrown");
          }}
          className="px-6 py-3 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 transition"
        >
          Throw Test Error
        </button>

        <button
          type="button"
          onClick={() => {
            Sentry.captureMessage("Sentry Test Message - Manual Capture");
            alert("Test message sent to Sentry!");
          }}
          className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
        >
          Send Test Message
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("/api/sentry-test");
              const data = await res.json();
              alert(data.message || "API error triggered");
            } catch (err) {
              console.error(err);
            }
          }}
          className="px-6 py-3 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition"
        >
          Trigger API Error
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-8">
        DSN configured: {process.env.NEXT_PUBLIC_SENTRY_DSN ? "Yes" : "No"}
      </p>
    </div>
  );
}
