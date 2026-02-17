'use client';

import dynamic from 'next/dynamic';

const ChatAssistant = dynamic(() => import('@/components/ChatAssistant'), { ssr: false });

export default function ChatAssistantWrapper() {
  return <ChatAssistant />;
}
