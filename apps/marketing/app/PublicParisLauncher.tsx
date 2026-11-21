'use client';

import ParisChat from '@/components/paris/ParisChat';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';

export function PublicParisLauncher() {
  return <ParisFloatingButton surface="public" Chat={ParisChat} />;
}
