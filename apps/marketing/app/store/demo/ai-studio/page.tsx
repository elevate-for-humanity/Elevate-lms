import type { Metadata } from 'next';
import AIStudioDemoClient from './AIStudioDemoClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'AI Studio Interactive Demo',
  description: 'Try the AI Studio training-content preview with selectable content types and instructor styles.',
};

export default function AIStudioDemoRoute() {
  return <AIStudioDemoClient />;
}
