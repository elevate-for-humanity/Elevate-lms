import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import type { RecentApplication } from "./types";

const STATUS_BADGE: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-800",
  submitted:  "bg-amber-100 text-amber-800",
  in_review:  "bg-blue-100 text-blue-800",
  approved:   "bg-emerald-100 text-emerald-800",
  enrolled:   "bg-teal-100 text-teal-800",
  rejected:   "bg-red-100 text-red-800",
  waitlisted: "bg-purple-100 text-purple-800",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", submitted: "Submitted", in_review: "In Review",
  approved: "Approved", enrolled: "Enrolled", rejected: "Rejected", waitlisted: "Waitlisted",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={"inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold " + (STATUS_BADGE[status] || "bg-gray-100 text-gray-600")}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function ageLabel(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function RecentApplicationsList({ items }: { items: RecentApplication[] }) {
  if (items.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-xs text-slate-400">No pending applications</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {items.slice(0, 8).map((app) => {
        const name = [app.first_name, app.last_name].filter(Boolean).join(" ") || app.full_name || "Unknown";
        return (
          <Link
            key={app.id}
            href={app.href}
            className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group ${app.urgent ? "bg-rose-50/40" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${app.urgent ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
              {name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-800 truncate">{name}</span>
                {app.urgent && <AlertTriangle className="w-3 h-3 text-rose-500 flex-shrink-0" />}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">
                {app.program_interest || "Program not specified"}
                <span className={`ml-2 font-medium ${app.urgent ? "text-rose-600" : "text-slate-400"}`}>
                  · {ageLabel(app.age_days)}
                </span>
              </div>
            </div>
            <Badge status={app.status} />
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
