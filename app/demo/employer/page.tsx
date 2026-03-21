'use client';

import { DemoPageShell } from '@/components/demo/DemoPageShell';
import InteractiveDemoPlayer from '@/components/demo/InteractiveDemoPlayer';
import { EMPLOYER_SCENES } from '@/lib/demo/scenes';

export default function DemoEmployerPage() {
  return (
    <DemoPageShell
      title="Employer Portal"
      description="Browse candidates, track apprenticeship hours, and manage hiring incentives — click to explore."
      portal="employer"
    >
      <InteractiveDemoPlayer
        scenes={EMPLOYER_SCENES}
        startSceneId="employer-overview"
        portalLabel="Employer Portal"
        trialHref="/apply/employer"
      />
    </DemoPageShell>
  );
}
