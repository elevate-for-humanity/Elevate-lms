import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-static';

export default function AIStudioDemoRoute() {
  permanentRedirect('/store/ai-studio#interactive-demo');
}
