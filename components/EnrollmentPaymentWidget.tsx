"use client";

import React from 'react';

import { useState } from "react";

interface EnrollmentPaymentWidgetProps {
  programId: string;
  programName: string;
}

export function EnrollmentPaymentWidget({
  programId,
  programName,
}: EnrollmentPaymentWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (planType: "full" | "payment-plan") => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          planType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      // Error: $1
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm font-semibold text-white">
        Ready to Enroll in {programName}?
      </p>
      <p className="mt-2 text-[11px] text-slate-300">
        Choose your payment option below. You&apos;ll be redirected to Stripe
        for secure checkout.
      </p>

      {error && (
        <div className="mt-3 rounded-md bg-red-900/20 border border-red-800 p-3">
          <p className="text-[11px] text-red-300">{error}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => handleCheckout("full")}
          disabled={loading}
          className="inline-flex rounded-md bg-brand-orange-600 px-4 py-2 text-[11px] font-semibold text-white hover:bg-brand-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Pay in Full"}
        </button>
        <button
          onClick={() => handleCheckout("payment-plan")}
          disabled={loading}
          className="inline-flex rounded-md bg-slate-700 px-4 py-2 text-[11px] font-semibold text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Payment Plan"}
        </button>
      </div>

      <p className="mt-3 text-[10px] text-slate-400">
        NOTE: This widget requires Stripe to be configured with real product and
        price IDs in <span className="font-mono">lms-data/billingConfig.ts</span>.
        Until then, checkout will fail gracefully.
      </p>
    </div>
  );
}
