import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { evaluateAccessibility } from '@/lib/ultimate-course-builder/accessibility/accessibility-contract';
import { LMS_RUNTIME_ACCESSIBILITY_EVIDENCE } from '@/lib/ultimate-course-builder/accessibility/lms-runtime-accessibility';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Ultimate LMS accessibility runtime contract', () => {
  it('keeps the lesson page and video controls wired to the declared evidence', () => {
    const page = source('apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/page.tsx');
    const player = source('components/lms/InteractiveVideoPlayer.tsx');
    const css = source('apps/lms/app/globals.css');

    expect(page).toContain('<h1');
    expect(page).toContain('<h2');
    expect(player).toContain('LMS_VIDEO_CONTROL_LABELS.playbackPosition');
    expect(player).toContain('LMS_VIDEO_CONTROL_LABELS.playbackSpeed');
    expect(player).toContain('LMS_VIDEO_CONTROL_LABELS.fullscreen');
    expect(player).toContain('aria-pressed={showCaptions}');
    expect(player).toContain("'• Correct!'");
    expect(player).toContain("'✗ Incorrect'");
    expect(player).toContain('text-slate-300');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');

    const { contractVersion, ...accessibilityEvidence } = LMS_RUNTIME_ACCESSIBILITY_EVIDENCE;
    expect(contractVersion).toBe('2026-09-29');

    expect(
      evaluateAccessibility({
        captions: true,
        transcript: true,
        altText: true,
        keyboardOperation: true,
        focusOrder: true,
        ...accessibilityEvidence,
        accessibleInteractionFallback: true,
      }),
    ).toMatchObject({ pass: true, critical: false, failures: [] });
  });
});
