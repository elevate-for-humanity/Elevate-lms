// Minimal page to test routing — swap back to full DevStudioUnifiedClient once routing is confirmed working
export const dynamic = 'force-dynamic';

export default function StudioPage() {
  return (
    <div style={{ padding: '2rem', color: 'white', background: '#1e1e1e', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>Studio Route Reached</h1>
      <p>Routing is working — DevStudioUnifiedClient imports need debugging.</p>
    </div>
  );
}
