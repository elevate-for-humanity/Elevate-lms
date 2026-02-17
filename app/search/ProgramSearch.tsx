"use client";

import React from 'react';

import { useEffect, useState } from "react";
import Link from "next/link";
import { allPrograms } from "@/lms-data/programs";

type Program = {
  id: string;
  title: string;
  slug: string;
  category?: string;
  fundingOptions?: string[];
  subtitle?: string;
};

export function ProgramSearch() {
  const [query, setQuery] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filtered, setFiltered] = useState<Program[]>([]);

  useEffect(() => {
    const visiblePrograms = allPrograms.filter((p) => p.visiblePublic);
    setPrograms(visiblePrograms as Program[]);
    setFiltered(visiblePrograms as Program[]);
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      programs.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(q))
      )
    );
  }, [query, programs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
          placeholder="Search by career, program, or funding (ex: CNA, HVAC, WIOA)…"
          className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-black Content:text-slate-400 focus:border-brand-red-500 focus:outline-none focus:ring-1 focus:ring-brand-red-500 md:max-w-md"
        />
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {programs.length} programs
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((program: any) => (
          <Link
            key={program.id}
            href={`/programs/${program.slug}`}
            className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 text-sm text-black shadow-sm hover:border-brand-red-200 hover:shadow-md"
          >
            <div>
              <h2 className="text-sm font-semibold text-black">
                {program.title}
              </h2>
              {program.category && (
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                  {program.category}
                </p>
              )}
              {program.subtitle && (
                <p className="mt-2 text-xs text-black">
                  {program.subtitle}
                </p>
              )}
            </div>
            <span className="mt-3 text-[11px] font-semibold text-brand-orange-600">
              View program →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
