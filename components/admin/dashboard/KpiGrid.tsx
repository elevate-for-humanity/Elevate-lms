"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Activity, FileClock, DollarSign, Award } from "lucide-react";
import type { KPICard } from "./types";

function fmtDollars(n: number) {
  return n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toLocaleString();
}
function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function iconFor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("learner") || l.includes("student")) return Activity;
  if (l.includes("application")) return FileClock;
  if (l.includes("revenue")) return DollarSign;
  return Award;
}

function KpiCard({ card }: { card: KPICard }) {
  const pos = card.delta >= 0;
  const Icon = iconFor(card.label);
  const isRevenue = card.label.toLowerCase().includes("revenue");

  return (
    <Link
      href={card.href}
      className={
        "relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow " +
        (card.urgent ? "border-rose-300" : "border-slate-200")
      }
    >
      <div className={"h-1.5 " + (card.urgent ? "bg-rose-500" : "bg-cyan-500")} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {isRevenue ? fmtDollars(card.value) : fmt(card.value)}
            </p>
          </div>
          <div className={"rounded-xl p-2 flex-shrink-0 " + (card.urgent ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600")}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {card.delta !== 0 && (
            <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold " + (pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
              {pos ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(card.delta)}%
            </span>
          )}
          <span className="text-xs text-slate-500">{card.deltaLabel}</span>
        </div>
      </div>
      {card.urgent && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
    </Link>
  );
}

export function KpiGrid({ kpis }: { kpis: KPICard[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((card) => (
        <KpiCard key={card.label} card={card} />
      ))}
    </section>
  );
}
