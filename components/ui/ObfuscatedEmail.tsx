'use client';

import React from 'react';

import { useState } from 'react';

interface ObfuscatedEmailProps {
  user: string;
  domain: string;
  className?: string;
  showIcon?: boolean;
}

export function ObfuscatedEmail({
  user,
  domain,
  className = '',
  showIcon = false,
}: ObfuscatedEmailProps) {
  const [revealed, setRevealed] = useState(false);

  const email = `${user}@${domain}`;

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className={`inline-flex items-center gap-2 ${className}`}
        aria-label="Click to reveal email address"
      >
        {showIcon && <span>📧</span>}
        <span className="font-mono">
          {user.slice(0, 3)}...@{domain}
        </span>
        <span className="text-xs opacity-70">(click to reveal)</span>
      </button>
    );
  }

  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  );
}
