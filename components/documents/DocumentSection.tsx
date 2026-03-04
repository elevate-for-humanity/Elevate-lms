interface Props {
  heading: string;
  children: React.ReactNode;
  /** Section number for numbered documents like MOUs */
  number?: number;
}

/**
 * Standard document section with consistent heading style.
 * Paragraphs stay under 6 lines. Headings every 3-5 paragraphs.
 */
export function DocumentSection({ heading, children, number }: Props) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
        {number !== undefined && (
          <span className="text-slate-400 mr-2">{number}.</span>
        )}
        {heading}
      </h2>
      <div className="text-sm text-slate-700 leading-relaxed space-y-3 [&>p]:max-w-prose [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1">
        {children}
      </div>
    </section>
  );
}
