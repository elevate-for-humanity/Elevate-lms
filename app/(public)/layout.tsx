// Public layout - uses root layout's header/footer via ConditionalLayout
// This layout is for route grouping only, no additional wrapper needed

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
