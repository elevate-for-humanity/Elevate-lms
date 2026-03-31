import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { BlockedProgram } from "./types";

export function BlockedProgramsList({ items }: { items: BlockedProgram[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Unpublished Programs</h2>
        <Link href="/admin/programs" className="text-xs text-blue-600 font-medium hover:underline">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">All programs published</p>
          </div>
        ) : (
          items.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{p.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Status: <span className="capitalize">{p.status}</span>
                  {p.updatedAt && ` · ${new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">
                Unpublished
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
