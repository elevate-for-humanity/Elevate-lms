/**
 * enforce-video-invariants.ts
 *
 * Repo-level tripwire. Runs as prebuild. Fails the build if any of the
 * following invariants are violated:
 *
 *   1. No raw <video> outside CanonicalVideo.tsx
 *      (player/avatar/exam exceptions are explicitly allowlisted below)
 *
 *   2. No preload="auto" anywhere
 *
 *   3. No autoPlay without muted in ambient (non-player) context
 *      (player components are allowlisted — they have controls or are
 *       explicitly interactive)
 *
 * To add a legitimate exception, add the file path to the appropriate
 * allowlist below with a comment explaining why.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// Files allowed to contain raw <video> — interactive players, avatars, exam camera.
// Every entry here must have a comment explaining why it is exempt.
const RAW_VIDEO_ALLOWLIST = new Set([
  // CanonicalVideo itself — this is the one allowed source of <video>
  'components/video/CanonicalVideo.tsx',
  // LMS lesson and course players — user-controlled, have seek/controls
  'components/lms/VideoPlayer.tsx',
  'components/lms/InteractiveVideoPlayer.tsx',
  'components/lms/HvacLessonVideo.tsx',
  'components/lms/HvacVideoPlayer.tsx',
  'components/lms/ContentLibrary.tsx',
  'components/lms/LessonVideoWithSimulation.tsx',
  'components/lms/LessonPlayer.tsx',
  'components/VideoShell.tsx',
  'components/course/VideoLessonPlayer.tsx',
  'components/mobile/MobileVideoPlayer.tsx',
  'components/media/UnifiedVideoPlayer.tsx',
  'components/CoursePlayer.tsx',
  'components/VideoPlayer.tsx',
  'components/video/VideoPlayer.tsx',
  'components/video/VideoSource.tsx',
  'components/video/InteractiveVideoPlayer.tsx',
  'components/video/AdvancedVideoPlayer.tsx',
  'components/video/InstrumentedVideoPlayer.tsx',
  'components/video/TikTokStyleVideoPlayer.tsx',
  'components/video/ProfessionalVideoPlayer.tsx',
  'components/programs/VideoHighlights.tsx',
  'components/programs/ProgramPageShell.tsx',
  'components/reels/ReelsFeed.tsx',
  'components/student/ProgramOrientationVideo.tsx',
  // Avatar/AI guide components — AI-driven narration, not ambient background
  'components/PageAvatar.tsx',
  'components/GlobalAvatar.tsx',
  'components/SideAvatarGuide.tsx',
  'components/HeroAvatarGuide.tsx',
  'components/AvatarChatAssistant.tsx',
  'components/AvatarChatBar.tsx',
  'components/AvatarCourseGuide.tsx',
  'components/AvatarVideoOverlay.tsx',
  'components/TutorialSystem.tsx',
  // Exam camera — getUserMedia stream, not a media file
  'components/exam/ExamCamera.tsx',
  // Store interactive demo — user-triggered play, not ambient
  'app/store/StoreDemoVideo.tsx',
  'app/store/StoreHeroVideo.tsx',
  'app/store/demos/DemoTabs.tsx',
  'app/store/courses/hvac-technician-course-license/page.tsx',
  // Avatar guides on apply/onboarding flows
  'app/apply/ApplyAvatarGuide.tsx',
  'app/onboarding/learner/orientation/OrientationAvatar.tsx',
  // Course/lesson players
  'app/career-services/courses/[slug]/learn/CoursePlayer.tsx',
  'app/courses/[courseId]/learn/VideoSection.tsx',
  'app/videos/[videoId]/page.tsx',
  // Controlled players with explicit controls attribute
  'app/tax/rise-up-foundation/page.tsx',
  'app/supersonic-fast-cash/page.tsx',
  'app/program-holder/training/page.tsx',
  'app/courses/catalog/page.tsx',
  // AI narrator — user-initiated, has controls
  'components/homepage/AiNarratorSection.tsx',
  // OptimizedVideo — orphaned, not imported anywhere, kept for reference
  'components/OptimizedVideo.tsx',
]);

// Files allowed to use autoPlay — avatar/guide components that narrate on mount
const AUTOPLAY_ALLOWLIST = new Set([
  'app/apply/ApplyAvatarGuide.tsx',
  'app/onboarding/learner/orientation/OrientationAvatar.tsx',
  'components/AvatarCourseGuide.tsx',
  'components/SideAvatarGuide.tsx',
  'components/AvatarVideoOverlay.tsx',
  'app/career-services/courses/[slug]/learn/CoursePlayer.tsx',
  'app/courses/catalog/page.tsx',
]);

const violations: string[] = [];

function relativePath(full: string): string {
  return path.relative(ROOT, full).replace(/\\/g, '/');
}

function scan(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist', '.turbo'].includes(entry.name)) continue;
      scan(full);
      continue;
    }

    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;

    const rel = relativePath(full);
    const content = fs.readFileSync(full, 'utf-8');

    // Invariant 1: no raw <video> outside allowlist
    if (content.includes('<video') && !RAW_VIDEO_ALLOWLIST.has(rel)) {
      violations.push(`RAW <video> outside CanonicalVideo: ${rel}`);
    }

    // Invariant 2: no preload="auto" anywhere
    if (content.includes('preload="auto"')) {
      violations.push(`preload="auto" found: ${rel}`);
    }

    // Invariant 3: no autoPlay outside allowlist
    if (content.includes('autoPlay') && !AUTOPLAY_ALLOWLIST.has(rel)) {
      // Ignore type definitions, prop interfaces, and comments
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (
          line.includes('autoPlay') &&
          !line.startsWith('//') &&
          !line.startsWith('*') &&
          !line.includes('autoPlay?') &&       // prop definition
          !line.includes('autoPlay =') &&       // default value
          !line.includes('autoPlay:') &&        // type/interface
          !line.includes('{autoPlay}') &&       // destructure
          !line.includes('autoPlay={autoPlay}') // passthrough
        ) {
          violations.push(`autoPlay outside allowlist (line ${i + 1}): ${rel}`);
          break;
        }
      }
    }
  }
}

scan(ROOT);

if (violations.length > 0) {
  console.error('\n❌ VIDEO INVARIANT VIOLATIONS:\n');
  violations.forEach((v) => console.error(`  ${v}`));
  console.error(
    '\nTo add a legitimate exception, add the file to the allowlist in scripts/enforce-video-invariants.ts with a comment explaining why.\n'
  );
  process.exit(1);
} else {
  console.log('✅ Video invariants clean');
}
