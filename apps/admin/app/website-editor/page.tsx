"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Status = "idle" | "saving" | "saved" | "error";

export default function WebsiteEditorPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      route: form.get("route"), title: form.get("title"), eyebrow: form.get("eyebrow"), headline: form.get("headline"), summary: form.get("summary"),
      primaryCtaLabel: form.get("primaryCtaLabel"), primaryCtaHref: form.get("primaryCtaHref"), secondaryCtaLabel: form.get("secondaryCtaLabel"), secondaryCtaHref: form.get("secondaryCtaHref"),
      heroImage: form.get("heroImage"), status: form.get("status"),
    };
    try {
      const response = await fetch("/api/admin/website-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Save failed");
      setStatus("saved");
      setMessage("Website content saved successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save content");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="font-bold text-blue-700">← Admin Dashboard</Link>
          <Link href="/website-editor/pages" className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white">Manage Public Pages</Link>
        </div>
        <div className="mt-6"><h1 className="text-4xl font-black text-slate-950">Website Editor</h1><p className="mt-3 text-lg text-slate-600">Update page titles, hero banners, descriptions, images, and calls to action.</p></div>
        <form onSubmit={save} className="mt-8 space-y-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <Field name="route" label="Page route" placeholder="/programs/medical-assistant" required />
          <Field name="title" label="Browser and SEO title" placeholder="Medical Assistant Training" required />
          <Field name="eyebrow" label="Hero eyebrow" placeholder="Healthcare Career Training" />
          <Field name="headline" label="Hero headline" placeholder="Train for a hands-on healthcare career." required />
          <TextArea name="summary" label="Hero summary" placeholder="Explain the program and the next step in clear student-focused language." required />
          <div className="grid gap-5 md:grid-cols-2"><Field name="primaryCtaLabel" label="Primary CTA label" placeholder="Apply Now" /><Field name="primaryCtaHref" label="Primary CTA link" placeholder="/apply?program=medical-assistant" /><Field name="secondaryCtaLabel" label="Secondary CTA label" placeholder="Request Information" /><Field name="secondaryCtaHref" label="Secondary CTA link" placeholder="/contact" /></div>
          <Field name="heroImage" label="Hero image path" placeholder="/images/programs/medical-assistant-hero.webp" />
          <label className="block"><span className="mb-2 block font-bold text-slate-800">Status</span><select name="status" defaultValue="draft" className="min-h-12 w-full rounded-xl border border-slate-300 px-4"><option value="draft">Draft</option><option value="published">Published</option></select></label>
          {message && <div className={status === "error" ? "rounded-xl bg-red-100 p-4 text-red-900" : "rounded-xl bg-emerald-100 p-4 text-emerald-900"}>{message}</div>}
          <button type="submit" disabled={status === "saving"} className="min-h-12 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-60">{status === "saving" ? "Saving..." : "Save Website Content"}</button>
        </form>
      </div>
    </main>
  );
}

function Field({ name, label, placeholder, required = false }: { name: string; label: string; placeholder: string; required?: boolean }) { return <label className="block"><span className="mb-2 block font-bold text-slate-800">{label}</span><input name={name} required={required} placeholder={placeholder} className="min-h-12 w-full rounded-xl border border-slate-300 px-4" /></label>; }
function TextArea({ name, label, placeholder, required = false }: { name: string; label: string; placeholder: string; required?: boolean }) { return <label className="block"><span className="mb-2 block font-bold text-slate-800">{label}</span><textarea name={name} required={required} placeholder={placeholder} rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3" /></label>; }
