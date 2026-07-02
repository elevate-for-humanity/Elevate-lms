import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
      <div style={{ textAlign: 'center', maxWidth: '32rem', padding: '1rem' }}>
        <div style={{ fontSize: '5rem', fontWeight: 900, color: '#64748b', marginBottom: '1rem' }}>404</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Page Not Found</h1>
        <p style={{ fontSize: '1.125rem', color: '#334155', marginBottom: '2rem' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
