export default function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  // The parent /provider layout owns authorization and the canonical shell.
  return children;
}
