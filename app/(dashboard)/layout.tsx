// Dashboard route group layout — server component.
// Individual pages handle their own auth and client state.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-content">{children}</div>;
}
