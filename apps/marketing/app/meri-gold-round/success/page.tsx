import Link from 'next/link';

export default function MeriGoldRoundSuccessPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0907', color: '#f7e4ad', padding: 24 }}>
      <section style={{ maxWidth: 620, textAlign: 'center' }}>
        <p style={{ letterSpacing: '.2em', fontSize: 12 }}>ORDER RECEIVED</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(42px, 8vw, 72px)', margin: '18px 0' }}>Thank you.</h1>
        <p style={{ color: '#d8cdb9', lineHeight: 1.7 }}>Your payment was completed securely. A receipt and order confirmation will be sent to the email used at checkout.</p>
        <Link href="/meri-gold-round" style={{ display: 'inline-block', marginTop: 26, color: '#171006', background: '#d9ae52', borderRadius: 999, padding: '14px 24px', textDecoration: 'none', fontWeight: 700 }}>Return to the store</Link>
      </section>
    </main>
  );
}
