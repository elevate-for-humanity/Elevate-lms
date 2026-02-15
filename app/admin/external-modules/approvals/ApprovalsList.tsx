"use client";

import React from 'react';

// app/admin/external-modules/approvals/ApprovalsList.tsx
// Client component for managing external module approvals

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

type Submission = {
  id: string;
  user_id: string;
  module_id: string;
  status: string;
  proof_file_url: string | null;
  notes: string | null;
  created_at: string;
  approved_at: string | null;
  external_partner_modules: {
    title: string;
    partner_name: string;
    course_id: string;
    courses: {
      title: string;
    };
  };
  profiles: {
    full_name: string;
    email: string;
  };
};

type Props = {
  pendingSubmissions: Submission[];
  recentlyApproved: Submission[];
};

export default function ApprovalsList({
  pendingSubmissions: initialPending,
  recentlyApproved: initialApproved,
}: Props) {
  const [pending, setPending] = useState(initialPending);
  const [approved, setApproved] = useState(initialApproved);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleApprove(submissionId: string) {
    setProcessing(submissionId);
    setMessage(null);

    try {
      if (!supabase || typeof supabase === 'string') {
        throw new Error("Supabase client not initialized");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("external_partner_progress")
        .update({
          status: "approved",
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (error) throw error;

      // Move from pending to approved
      const submission = pending.find((s) => s.id === submissionId);
      if (submission) {
        setPending(pending.filter((s) => s.id !== submissionId));
        setApproved([
          { ...submission, status: "approved", approved_at: new Date().toISOString() },
          ...approved,
        ]);
      }

      setMessage("Submission approved successfully");
    } catch (err: any) {
      setMessage("An error occurred");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(submissionId: string) {
    setProcessing(submissionId);
    setMessage(null);

    try {
      if (!supabase || typeof supabase === 'string') {
        throw new Error("Supabase client not initialized");
      }

      const { error } = await supabase
        .from("external_partner_progress")
        .update({
          status: "in_progress",
          proof_file_url: null,
        })
        .eq("id", submissionId);

      if (error) throw error;

      setPending(pending.filter((s) => s.id !== submissionId));
      setMessage("Submission rejected - student can resubmit");
    } catch (err: any) {
      setMessage("An error occurred");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border bg-slate-50 p-4">
          <p className="text-sm text-black">{message}</p>
        </div>
      )}

      {/* Pending Submissions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Pending Approvals ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-center">
            <p className="text-sm text-black">
              No pending submissions to review
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {submission.profiles.full_name}
                      </h3>
                      <p className="text-xs text-black">
                        {submission.profiles.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700">
                        {submission.external_partner_modules.title}
                      </p>
                      <p className="text-xs text-black">
                        {submission.external_partner_modules.partner_name} •{" "}
                        {submission.external_partner_modules.courses.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Submitted:{" "}
                      {new Date(submission.created_at).toLocaleString()}
                    </p>
                    {submission.notes && (
                      <p className="text-xs text-black italic">
                        Note: {submission.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {submission.proof_file_url && (
                      <a
                        href={submission.proof_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-2.5 text-xs font-semibold text-black hover:bg-slate-200"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Proof
                      </a>
                    )}
                    <button
                      onClick={() => handleApprove(submission.id)}
                      disabled={processing === submission.id}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {processing === submission.id ? "..." : "• Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      disabled={processing === submission.id}
                      className="inline-flex items-center justify-center rounded-full bg-red-100 px-3 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      {processing === submission.id ? "..." : "✗ Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Approved */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Recently Approved ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-center">
            <p className="text-sm text-black">No recent approvals</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approved.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">
                      {submission.profiles.full_name}
                    </p>
                    <p className="text-xs text-black">
                      {submission.external_partner_modules.title} •{" "}
                      {submission.external_partner_modules.partner_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      • Approved
                    </p>
                    {submission.approved_at && (
                      <p className="text-[11px] text-black">
                        {new Date(submission.approved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
