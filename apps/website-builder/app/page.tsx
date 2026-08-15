export default function WebsiteBuilderHome() {
  return (
    <main style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <p style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b91c1c' }}>Elevate Apps</p>
        <h1 style={{ fontSize: 42, margin: '8px 0 12px' }}>Website Builder</h1>
        <p style={{ maxWidth: 720, fontSize: 18, lineHeight: 1.6, color: '#475569' }}>
          Standalone Website Builder service boundary. Existing Builder functionality will be migrated here without changing the canonical SiteConfig, Supabase data, PARIS workflows, or published customer sites.
        </p>
      </div>
    </main>
  );
}
