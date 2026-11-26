'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bot } from 'lucide-react';

export const PARIS_AVATAR_SRC = '/images/paris/paris-avatar.webp';

interface ParisAvatarProps {
  /** Rendered pixel size of the avatar image (width and height). */
  size?: number;
  /** Extra classes applied to the rendered image (e.g. sizing, ring). */
  className?: string;
  /** Classes for the fallback icon shown if the image fails to load. */
  fallbackIconClassName?: string;
}

/**
 * PARIS portrait avatar: a photorealistic portrait of PARIS.
 * Falls back to the Bot icon if the image asset fails to load, so the chat
 * never renders an empty avatar.
 */
export default function ParisAvatar({
  size = 32,
  className = '',
  fallbackIconClassName = 'h-4 w-4',
}: ParisAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Bot className={fallbackIconClassName} aria-hidden="true" />;
  }

  return (
    <Image
      src={PARIS_AVATAR_SRC}
      alt="PARIS"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
