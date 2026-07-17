import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      <h1>Elevate for Humanity</h1>
      <p>Vocational education and workforce development</p>
      <Link href="/about">About</Link>
    </main>
  );
}
