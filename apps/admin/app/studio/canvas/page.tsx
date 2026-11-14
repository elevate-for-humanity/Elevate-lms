import type { Metadata } from 'next';
import LiveCanvas from '@/components/dev-studio/live-canvas/LiveCanvas';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Live Canvas | Dev Studio',
  robots: { index: false, follow: false },
};

export default function StudioCanvasPage() {
  return <LiveCanvas />;
}
