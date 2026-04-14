'use client';
import { useEffect, useState } from 'react';

export function AdminGreeting({ name }: { name: string }) {
  // Default to 'Good morning' to avoid a blank flash before hydration.
  // The useEffect corrects it to the actual time-of-day greeting client-side.
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  return <>{greeting}, {name}.</>;
}
