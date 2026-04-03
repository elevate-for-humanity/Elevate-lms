'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const AIAssistantBubble = dynamic(
  () => import('@/components/AIAssistantBubble').then(m => ({ default: m.AIAssistantBubble })),
  { ssr: false, loading: () => null }
);

const APP_ROUTE_PREFIXES = [
  '/lms', '/admin', '/learner', '/instructor', '/employer',
  '/partner', '/staff-portal', '/mentor', '/program-holder',
];

export default function ConditionalAIBubble() {
  const pathname = usePathname();
  const isAppRoute = APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
  if (isAppRoute) return null;
  return <AIAssistantBubble />;
}
