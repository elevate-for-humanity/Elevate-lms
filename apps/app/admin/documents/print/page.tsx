'use client';

import Link from 'next/link';

export default function AdminDocumentsPrintPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents Print Center</h1>
        <p className="mt-2 text-sm text-slate-600">
          Open a document in the Document Center, then print from this page or your browser print dialog.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/document-center" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Open Document Center
          </Link>
          <Link href="/admin/documents/upload" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Upload Documents
          </Link>
          <button onClick={() => window.print()} className="rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700">
            Print Current View
          </button>
        </div>
      </div>
    </div>
  );
}
