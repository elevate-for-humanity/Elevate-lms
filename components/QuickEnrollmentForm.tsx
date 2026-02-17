"use client";

import React from 'react';

import { useState } from "react";

const PROGRAM_OPTIONS = [
  { label: "CNA Training", value: "cna" },
  { label: "Barber Apprenticeship", value: "barber-apprenticeship" },
  { label: "HVAC Technician", value: "hvac-tech" },
  { label: "Building Tech", value: "building-tech" },
  { label: "CDL Training", value: "cdl" },
  { label: "Medical Assistant", value: "medical-assistant" },
  { label: "Tax Preparation & VITA", value: "tax-vita" },
];

const FUNDING_OPTIONS = [
  { label: "I need help with funding (WRG/WIOA/JRI)", value: "grant" },
  { label: "Employer-sponsored / OJT / WEX", value: "employer" },
  { label: "Self-pay or payment plan", value: "self-pay" },
  { label: "Not sure yet", value: "unsure" },
];

const REFERRAL_OPTIONS = [
  { label: "WorkOne / Workforce Board", value: "workone" },
  { label: "Job Ready Indy (JRI)", value: "jri" },
  { label: "Employer / HR", value: "employer" },
  { label: "Family or Friend", value: "family" },
  { label: "Social Media", value: "social" },
  { label: "Other", value: "other" },
];

export function QuickEnrollmentForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [programCode, setProgramCode] = useState("cna");
  const [fundingInterest, setFundingInterest] = useState("grant");
  const [referralSource, setReferralSource] = useState("workone");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          programCode,
          fundingInterest,
          referralSource,
          notes,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
      } else {
        setMessage(
          "Thank you! Your application was submitted. An Elevate coach will reach out soon.",
        );
        // Clear form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setNotes("");
      }
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
    >
      <div>
        <h3 className="text-lg font-bold text-black">Apply Now</h3>
        <p className="mt-1 text-sm text-black">
          Fill out this form and we'll help you get started.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-brand-green-50 border border-brand-green-200 p-4">
          <p className="text-sm font-semibold text-brand-green-800">{message}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-brand-red-50 border border-brand-red-200 p-4">
          <p className="text-sm font-semibold text-brand-red-800">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-black">
            First Name *
          </label>
          <input
            required
            value={firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">
            Last Name *
          </label>
          <input
            required
            value={lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-black">
            Email *
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">
            Phone (optional)
          </label>
          <input
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black">
          Program *
        </label>
        <select
          value={programCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setProgramCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        >
          {PROGRAM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black">
          How will you cover tuition?
        </label>
        <select
          value={fundingInterest}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFundingInterest(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        >
          {FUNDING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black">
          How did you hear about us?
        </label>
        <select
          value={referralSource}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReferralSource(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        >
          {REFERRAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black">
          Additional Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-orange-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand-orange-600 px-6 py-3 font-bold text-white hover:bg-brand-orange-700 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
