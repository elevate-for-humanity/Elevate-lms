'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div>
          <h1>Error</h1>
          <p>Something went wrong</p>
          <button onClick={() => reset()}>Try Again</button>
          <Link href="/"><Home size={20} /> Go Home</Link>
        </div>
      </body>
    </html>
  );
}
