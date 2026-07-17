// Root loading fallback — shown while a page segment streams in.
// Intentionally invisible: the header is already rendered, so a full-screen
// spinner causes a jarring layout shift. Pages that need a visible loading
// state should define their own loading.tsx in their route segment.
export default function Loading() {
  return <div className="min-h-[60vh]" aria-hidden="true" />;
}
