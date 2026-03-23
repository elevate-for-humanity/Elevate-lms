/**
 * enforce-ui-invariants.ts — prebuild tripwire for UI integrity.
 * Run via: tsx scripts/enforce-ui-invariants.ts
 *
 * Catches:
 *   [video] Raw <video> outside CanonicalVideo + player/avatar allowlist
 *   [video] preload="auto" anywhere in TSX/JSX
 *   [video] autoPlay as JSX video attribute outside avatar/player allowlist
 *   [image] alt="" on Image/img not in decorative allowlist
 *   [image] Hardcoded remote https:// src in JSX Image/img props
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const violations: string[] = [];

const RAW_VIDEO_ALLOWLIST = new Set([
  'components/video/CanonicalVideo.tsx',
  'components/lms/VideoPlayer.tsx','components/lms/InteractiveVideoPlayer.tsx',
  'components/lms/HvacLessonVideo.tsx','components/lms/HvacVideoPlayer.tsx',
  'components/lms/ContentLibrary.tsx','components/lms/LessonVideoWithSimulation.tsx',
  'components/lms/LessonPlayer.tsx','components/lms/ModulePage.tsx',
  'components/lms/TrainingLessonFlow.tsx',
  'components/VideoShell.tsx','components/course/VideoLessonPlayer.tsx',
  'components/mobile/MobileVideoPlayer.tsx','components/media/UnifiedVideoPlayer.tsx',
  'components/CoursePlayer.tsx','components/VideoPlayer.tsx',
  'components/VideoInterview.jsx',
  'components/video/VideoPlayer.tsx','components/video/VideoSource.tsx',
  'components/video/InteractiveVideoPlayer.tsx','components/video/AdvancedVideoPlayer.tsx',
  'components/video/InstrumentedVideoPlayer.tsx','components/video/TikTokStyleVideoPlayer.tsx',
  'components/video/ProfessionalVideoPlayer.tsx',
  'components/programs/VideoHighlights.tsx','components/programs/ProgramPageShell.tsx',
  'components/reels/ReelsFeed.tsx','components/student/ProgramOrientationVideo.tsx',
  'components/PageAvatar.tsx','components/GlobalAvatar.tsx','components/SideAvatarGuide.tsx',
  'components/HeroAvatarGuide.tsx','components/AvatarChatAssistant.tsx',
  'components/AvatarChatBar.tsx','components/AvatarCourseGuide.tsx',
  'components/AvatarVideoOverlay.tsx','components/TutorialSystem.tsx','components/PageGuide.tsx',
  'components/exam/ExamCamera.tsx','components/homepage/AiNarratorSection.tsx',
  'app/store/StoreDemoVideo.tsx','app/store/StoreHeroVideo.tsx','app/store/StoreProductVideo.tsx','app/store/demos/DemoTabs.tsx',
  'components/demo/InteractiveDemoPlayer.tsx',
  'app/store/courses/hvac-technician-course-license/page.tsx',
  'app/apply/ApplyAvatarGuide.tsx','app/components/AIInstructor.tsx',
  'app/onboarding/learner/orientation/OrientationAvatar.tsx',
  'app/career-services/courses/[slug]/learn/CoursePlayer.tsx',
  'app/courses/[courseId]/learn/VideoSection.tsx','app/videos/[videoId]/page.tsx',
  'app/tax/rise-up-foundation/page.tsx','app/supersonic-fast-cash/page.tsx',
  'app/program-holder/training/page.tsx','app/courses/catalog/page.tsx',
  'components/TextToSpeech.tsx',
  'components/VideoInterview.jsx',
  'components/VoiceoverPlayer.tsx',
  'components/media/UnifiedVideoPlayer.tsx',
]);

const AUTOPLAY_ALLOWLIST = new Set([
  'app/apply/ApplyAvatarGuide.tsx','app/components/AIInstructor.tsx',
  'app/onboarding/learner/orientation/OrientationAvatar.tsx',
  'components/AvatarChatAssistant.tsx','components/AvatarCourseGuide.tsx',
  'components/AvatarVideoOverlay.tsx','components/HeroAvatarGuide.tsx',
  'components/PageGuide.tsx','components/SideAvatarGuide.tsx',
  'components/VideoShell.tsx','components/exam/ExamCamera.tsx',
  'components/lms/VideoPlayer.tsx','components/reels/ReelsFeed.tsx',
  'components/student/ProgramOrientationVideo.tsx',
  'components/video/TikTokStyleVideoPlayer.tsx','components/video/VideoSource.tsx',
  'app/career-services/courses/[slug]/learn/CoursePlayer.tsx',
  'app/courses/catalog/page.tsx',
  'components/TextToSpeech.tsx',
  'components/VideoInterview.jsx',
  'components/VoiceoverPlayer.tsx',
  'components/media/UnifiedVideoPlayer.tsx',
]);

const EMPTY_ALT_ALLOWLIST = new Set([
  'components/video/CanonicalVideo.tsx',
  'components/RotatingHeroBanner.tsx',
]);

const REMOTE_IMAGE_ALLOWLIST = new Set([
  'app/api/orientation/schedule/route.ts',
  'app/api/outreach/send/route.ts',
  'app/api/schedule-consultation/route.ts',
  'lib/stripe/tuition-webhook-handler.ts',
]);

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', '.turbo', 'scripts', 'public']);

function rel(full: string): string {
  return path.relative(ROOT, full).replace(/\\/g, '/');
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full);
      continue;
    }
    if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;

    const r = rel(full);
    const text = fs.readFileSync(full, 'utf-8');
    const lines = text.split('\n');

    // Raw <video>
    if (text.includes('<video') && !RAW_VIDEO_ALLOWLIST.has(r)) {
      violations.push(`[video] Raw <video> outside CanonicalVideo: ${r}`);
    }

    // preload="auto"
    if (text.includes('preload="auto"')) {
      violations.push(`[video] preload="auto" found: ${r}`);
    }

    // autoPlay as JSX attribute (not prop name in interface/type)
    if (!AUTOPLAY_ALLOWLIST.has(r)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          /\bautoPlay\b/.test(line) &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*') &&
          !/autoPlay[?:]/.test(line) &&
          !/interface\s|type\s/.test(line) &&
          /[\s{(]autoPlay/.test(line)
        ) {
          violations.push(`[video] autoPlay as JSX attribute outside allowlist (line ${i + 1}): ${r}`);
          break;
        }
      }
    }

    // Empty alt
    if (!EMPTY_ALT_ALLOWLIST.has(r)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          (line.includes('<Image') || line.includes('<img')) &&
          /alt=["']{2}/.test(line) &&
          !line.includes('aria-hidden')
        ) {
          violations.push(`[image] Empty alt on Image/img (line ${i + 1}): ${r}`);
        }
      }
    }

    // Hardcoded remote image src
    if (!REMOTE_IMAGE_ALLOWLIST.has(r)) {
      const matches = text.match(/<(?:Image|img)[^>]*src=["'](https?:\/\/[^"']+)["']/g);
      if (matches) {
        for (const m of matches) {
          if (!m.includes('supabase') && !m.includes('gravatar') && !m.includes('lh3.googleusercontent')) {
            violations.push(`[image] Hardcoded remote image src: ${r} — ${m.slice(0, 80)}`);
          }
        }
      }
    }
  }
}

walk(ROOT);

if (violations.length > 0) {
  console.error('\n❌ UI INVARIANT VIOLATIONS:\n');
  violations.forEach((v) => console.error(`  ${v}`));
  console.error('\nAdd legitimate exceptions to the allowlists in scripts/enforce-ui-invariants.ts\n');
  process.exit(1);
} else {
  console.log('✅ UI invariants clean');
}
