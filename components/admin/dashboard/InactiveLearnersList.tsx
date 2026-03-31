import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { InactiveLearner } from "./types";

export function InactiveLearnersList({ items }: { items: InactiveLearner[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          Inactive Learners
        </h2>
        <Link href="/admin/at-risk" className="text-xs text-blue-600 font-medium hover:underline">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">All learners active</p>
          </div>
        ) : (
          items.map((l) => (
            <Link
              key={l.enrollmentId}
              href={l.href}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                {(l.fullName || l.email || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {l.fullName || l.email || "Unknown"}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Enrolled{" "}
                  {l.enrolledAt
                    ? new Date(l.enrolledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "—"}{" "}
                  · No activity 3+ days
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                Stalled
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
