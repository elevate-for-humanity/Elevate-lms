// Dynamic imports for client-side components
// These are loaded dynamically to reduce initial bundle size

export function DynamicPDFViewer(props: { url: string; title: string; showDownload?: boolean; showPagination?: boolean; className?: string }) {
  // Lazy loaded component - render as iframe
  return (
    <iframe
      src={`${props.url}#toolbar=0`}
      className={props.className}
      title={props.title}
      style={{ width: '100%', height: '600px', border: 'none' }}
    />
  );
}

export function DynamicRichTextEditor(props: { 
  content?: string; 
  onChange?: (content: string) => void; 
  placeholder?: string;
  className?: string;
}) {
  // Lazy loaded component - render as textarea for now
  return (
    <textarea
      className={props.className}
      placeholder={props.placeholder}
      defaultValue={props.content}
      onChange={(e) => props.onChange?.(e.target.value)}
      style={{ minHeight: '200px', width: '100%', padding: '1rem' }}
    />
  );
}
