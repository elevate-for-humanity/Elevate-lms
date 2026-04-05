'use client';
import { useEffect, useState } from 'react';

export function AdminGreeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  if (!greeting) return null;
  return <>{greeting}, {name}.</>;
}
