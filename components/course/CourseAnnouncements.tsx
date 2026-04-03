"use client";

import React from 'react';

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export function CourseAnnouncements({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/${courseId}/announcements`);
        const json = await res.json();
        setItems(json.announcements || []);
      } catch (e) {
        // Error logged
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (loading) {
    return (
      <section className="mt-6 rounded-xl border p-4 text-xs text-slate-500">
        Loading announcements…
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-6 rounded-xl border p-4 text-xs text-slate-500">
        <h2 className="text-sm font-semibold text-black mb-2">
          Course announcements
        </h2>
        <p>No announcements yet.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border p-4 text-xs">
      <h2 className="text-sm font-semibold text-black mb-3">
        Course announcements
      </h2>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id} className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs font-semibold">{a.title}</p>
            <p className="mt-1 text-xs text-black whitespace-pre-line">
              {a.body}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {new Date(a.created_at).toLocaleString('en-US')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
