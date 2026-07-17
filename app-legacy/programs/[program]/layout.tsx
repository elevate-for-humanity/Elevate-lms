// PUBLIC ROUTE: program detail pages are public marketing content — no auth required
export default function ProgramLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ program: string }>;
}) {
  // Existence check is handled by the page itself (notFound() when slug not found).
  // Layout must not call requireAdminClient — it throws at build time and causes
  // all [program] routes to 307 redirect.
  return children;
}
