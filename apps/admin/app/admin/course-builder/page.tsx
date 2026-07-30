"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { Metadata } from "next";

export default function CourseBuilderPage() {
  const [message, setMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const save = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const data =
      new FormData(event.currentTarget);

    const response = await fetch(
      "/api/admin/courses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.get("title"),
          slug: data.get("slug"),
          description:
            data.get("description"),
          programId: data.get("programId"),
          status: data.get("status"),
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.error ??
          "Unable to create course",
      );
      setSaving(false);
      return;
    }

    setMessage(
      "Course created. Add modules and lessons next.",
    );

    setSaving(false);
    event.currentTarget.reset();
  };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/dashboard"
          className="font-bold text-blue-700"
        >
          ← Admin Dashboard
        </Link>

        <h1 className="mt-6 text-4xl font-black text-slate-950">
          Course Builder
        </h1>

        <p className="mt-3 text-lg text-slate-600">
          Create a course record before adding
          modules, lessons, assignments, and exams.
        </p>

        <form
          onSubmit={save}
          className="mt-8 space-y-6 rounded-3xl bg-white p-7 shadow-sm"
        >
          <CourseField
            name="title"
            label="Course title"
            placeholder="Medical Terminology"
          />

          <CourseField
            name="slug"
            label="Course slug"
            placeholder="medical-terminology"
          />

          <label className="block">
            <span className="mb-2 block font-bold text-slate-800">
              Description
            </span>

            <textarea
              name="description"
              rows={6}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <CourseField
            name="programId"
            label="Program ID"
            placeholder="Optional program UUID"
            required={false}
          />

          <label className="block">
            <span className="mb-2 block font-bold text-slate-800">
              Status
            </span>

            <select
              name="status"
              defaultValue="draft"
              className="min-h-12 w-full rounded-xl border border-slate-300 px-4"
            >
              <option value="draft">
                Draft
              </option>
              <option value="published">
                Published
              </option>
            </select>
          </label>

          {message && (
            <div className="rounded-xl bg-blue-100 p-4 text-blue-950">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="min-h-12 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-60"
          >
            {saving
              ? "Creating..."
              : "Create Course"}
          </button>
        </form>
      </div>
    </main>
  );
}

function CourseField({
  name,
  label,
  placeholder,
  required = true,
}: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-800">
        {label}
      </span>

      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-xl border border-slate-300 px-4"
      />
    </label>
  );
}
