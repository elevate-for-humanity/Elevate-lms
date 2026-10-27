// Legacy portal paths only redirect to canonical program-holder routes.
// The parent program-holder layout already enforces program-holder access.
// Do not mount an additional dashboard frame around redirecting pages:
// the destination route owns its own authenticated frame.
export default function LegacyProgramHolderRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
