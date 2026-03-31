import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

export function RecentApplicationsList({ items }: { items: RecentApplication[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Recent Applications</h2>
        <Link href="/admin/applications" className="text-xs text-blue-600 font-medium hover:underline">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-xs text-slate-400">No applications yet</p>
          </div>
        ) : (
          items.slice(0, 6).map((app) => {
            const name = [app.first_name, app.last_name].filter(Boolean).join(" ") || app.full_name || "Unknown";
            return (
              <Link
                key={app.id}
                href={app.href}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {app.program_interest || "Program not specified"} ·{" "}
                    {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <Badge status={app.status} />
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
