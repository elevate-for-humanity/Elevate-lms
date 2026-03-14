interface RichTextProps {
  content: string;       // plain text or basic HTML
  max_width?: string;    // e.g. "3xl", "4xl", "prose"
  align?: 'left' | 'center' | 'right';
}

export default function RichText({
  content,
  max_width = '3xl',
  align = 'left',
}: RichTextProps) {
  const alignClass =
    align === 'center' ? 'text-center mx-auto' :
    align === 'right'  ? 'text-right ml-auto'  : '';

  return (
    <section className="py-12 px-4">
      <div
        className={`max-w-${max_width} ${alignClass} prose prose-slate`}
        // Content is admin-entered, not user-submitted — safe for innerHTML
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
