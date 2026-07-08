'use client';

import dynamic from 'next/dynamic';

const ChatAssistant = dynamic(
  () => import('@/components/ChatAssistant').then(m => m.default || m),
  { ssr: false }
);

export default function ChatAssistantWrapper() {
  return <ChatAssistant />;
}
