import { Metadata } from 'next';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import InteractiveDemoPlayer from '@/components/demo/InteractiveDemoPlayer';
import { ADMIN_SCENES } from '@/lib/demo/scenes';

export const metadata: Metadata = {
  title: 'Admin Portal Demo | Elevate for Humanity',
  description: 'Interactive walkthrough of the Elevate admin portal — enrollment, WIOA compliance, funding, and outcomes.',
  robots: { index: false, follow: false },
};

export default function DemoAdminPage() {
  return (
    <DemoPageShell
      title="Admin Portal"
      description="Click through the platform — every scene is a real walkthrough. Choose what you want to see next."
      portal="admin"
    >
      <InteractiveDemoPlayer
        scenes={ADMIN_SCENES}
        startSceneId="admin-overview"
        portalLabel="Admin Portal"
        trialHref="/store/trial"
      />
    </DemoPageShell>
  );
}
