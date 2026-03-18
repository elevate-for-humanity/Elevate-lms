import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function EmptyEnrollmentState() {
  return (
    <div className="mb-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No programs enrolled yet</h3>
      <p className="text-slate-600 text-sm mb-6 max-w-sm mx-auto">
        Browse available programs and apply to get started. Most programs are funded for eligible Indiana residents.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/lms/programs"
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-slate-700 transition"
        >
          Browse Programs
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-slate-50 transition"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
