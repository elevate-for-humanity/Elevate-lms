// Marketing layout - applies larger text for marketing pages

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketing-content">{children}</div>;
}
