"use client";

import React from 'react';

import { useState } from "react";

type AdminExternalProgressRow = {
  id: string;
  status: "not_started" | "in_progress" | "submitted" | "approved";
  proof_file_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string | null;
  } | null;
  module: {
    id: string;
    title: string;
    partner_name: string;
    course: {
      id: string;
      title: string;
    } | null;
  } | null;
};

type Props = {
  initialRows: AdminExternalProgressRow[];
};

export default function ExternalProgressAdminClient({ initialRows }: Props) {
  const [rows, setRows] = useState<AdminExternalProgressRow[]>(initialRows);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(
    id: string,
    status: "approved" | "in_progress"
  ) {
    try {
      setLoadingId(id);
      setMessage(null);

      const res = await fetch("/api/admin/external-progress/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status, updated_at: new Date().toISOString() }
            : r
        )
      );

      setMessage(
        status === "approved"
          ? "Module marked as approved."
          : "Module reset back to in progress."
      );
    } catch (err: any) {
      setMessage("An error occurred");
    } finally {
      setLoadingId(null);
    }
  }

  // Filter rows by status
  const submitted = rows.filter((r) => r.status === "submitted");
  const approved = rows.filter((r) => r.status === "approved");
  const inProgress = rows.filter(
    (r) => r.status === "in_progress" || r.status === "not_started"
  );

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">{message}</p>
        </div>
      )}

      <div className="rounded-lg border bg-brand-blue-50 p-4 text-sm">
        <p className="font-semibold mb-2">How this works</p>
        <ul className="space-y-1 text-black">
          <li>
            • <span className="font-semibold">submitted</span> – student
            uploaded proof. Awaiting review.
          </li>
          <li>
            • <span className="font-semibold">approved</span> – counts as
            completed inside the course.
          </li>
          <li>
            • Use <span className="font-semibold">Reset</span> if the proof is
            invalid and the student should redo or re-upload.
          </li>
        </ul>
      </div>

      {/* Pending Submissions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Pending Submissions ({submitted.length})
        </h2>
        {submitted.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-center">
            <p className="text-sm text-black">
              No pending submissions to review
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm bg-white">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Student</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Course / Module
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Partner</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Proof</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submitted.map((row: any) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold">
                        {row.user?.full_name || "Unknown"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {row.user?.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold">
                        {row.module?.course?.title || "Course"}
                      </div>
                      <div className="text-xs text-black">
                        {row.module?.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm">{row.module?.partner_name}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-xs text-black">
                        {new Date(row.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(row.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {row.proof_file_url ? (
                        <a
                          href={row.proof_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 underline text-sm"
                        >
                          <svg
                            className="w-4 h-4"
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
                          View proof
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">
                          No file uploaded
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loadingId === row.id}
                          onClick={() => updateStatus(row.id, "approved")}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {loadingId === row.id ? "..." : "• Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={loadingId === row.id}
                          onClick={() => updateStatus(row.id, "in_progress")}
                          className="inline-flex items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold text-black hover:bg-slate-300 disabled:opacity-50"
                        >
                          {loadingId === row.id ? "..." : "✗ Reset"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <p className="text-sm text-black">No approved modules yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approved.slice(0, 10).map((row: any) => (
              <div
                key={row.id}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {row.user?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs text-black">
                    {row.module?.title} • {row.module?.partner_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-700">
                    • Approved
                  </p>
                  <p className="text-xs text-black">
                    {new Date(row.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            In Progress ({inProgress.length})
          </h2>
          <div className="space-y-2">
            {inProgress.slice(0, 5).map((row: any) => (
              <div
                key={row.id}
                className="rounded-lg border bg-white p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {row.user?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs text-black">
                    {row.module?.title} • {row.module?.partner_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-black">
                    Status: {row.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
