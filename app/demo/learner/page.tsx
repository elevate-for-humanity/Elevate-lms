'use client';

import { DemoPageShell } from '@/components/demo/DemoPageShell';
import InteractiveDemoPlayer from '@/components/demo/InteractiveDemoPlayer';
import { STUDENT_SCENES } from '@/lib/demo/scenes';

export default function DemoLearnerPage() {
  return (
    <DemoPageShell
      title="Student Portal"
      description="See what your students experience — courses, hours, and credentials. Click to explore each section."
      portal="learner"
    >
      <InteractiveDemoPlayer
        scenes={STUDENT_SCENES}
        startSceneId="student-overview"
        portalLabel="Student Portal"
        trialHref="/apply/student"
      />
    </DemoPageShell>
  );
}
