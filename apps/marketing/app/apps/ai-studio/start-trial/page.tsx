import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-static';

export default function AIStudioTrialRoute() {
  permanentRedirect('/store/trial?app=ai-studio');
}
