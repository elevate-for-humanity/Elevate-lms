'use client';
export function PrintDocumentControl() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="my-3 min-h-12 rounded-xl border bg-white px-4 font-bold text-blue-900 print:hidden"
    >
      Print or save this document as PDF
    </button>
  );
}
