import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Studio, Course Builder and PWA layout regression', () => {
  it('does not force fullscreen on Course Builder selection or duplicate a fixed viewport', () => {
    const studio = source('components/studio/StudioCommandWorkspace.tsx');
    const viewport = source('components/studio/useStudioViewport.ts');
    expect(studio).not.toContain("if (surface === 'course') setFocusMode(true)");
    expect(viewport).not.toContain("position: 'fixed'");
    expect(viewport).toContain('height: viewport?.height ?? window.innerHeight');
  });
  it('keeps the conversation input readable and compact with independently scrollable messages', () => {
    const chat = source('components/studio/UnifiedEllieChat.tsx');
    const styles = source('components/studio/UnifiedEllieChat.module.css');
    expect(chat).toContain('rows={2}');
    expect(chat).toContain('min-h-[64px]');
    expect(chat).not.toContain('min-h-[180px]');
    expect(chat).toContain('overflow-y-auto bg-slate-50');
    expect(styles).toContain('font-size: max(1.25rem, 20px)');
    expect(styles).toContain('max-height: max(min(28dvh, 240px), calc(2lh + 1.5rem + 2px))');
    expect(chat).not.toContain('max-h-[min(28dvh,240px)]');
    expect(chat).toContain('text-xl leading-[1.5]');
    expect(chat).not.toContain('py-2 text-base leading-6 outline-none');
  });
  it('keeps the composer above the Admin mobile textarea zoom guard', () => {
    const globals = source('apps/admin/app/globals.css');
    const styles = source('components/studio/UnifiedEllieChat.module.css');
    const mobileGuard = globals.match(/@media\s*\(max-width:\s*1024px\)\s*\{\s*input\[type='text'\][\s\S]*?textarea,[\s\S]*?font-size:\s*16px\s*!important/);
    expect(mobileGuard).not.toBeNull();
    const composer = styles.match(/\.root\s+\.composer\s*\{([^}]+)\}/)?.[1] || '';
    // Equal importance, with two scoped classes outranking the global type selector.
    expect(composer).toMatch(/font-size:\s*max\(1\.25rem,\s*20px\)\s*!important\s*;/);
    expect(styles.match(/font-size:[^;]+!important/g)).toHaveLength(1);
  });
  it('respects narrow screens without forcing a second column or oversized tool typography', () => {
    const studio = source('components/studio/StudioCommandWorkspace.tsx');
    const course = source('components/admin/course-builder/UnifiedCourseBuilder.tsx');
    const css = source('apps/admin/styles/studio-workspace.css');
    expect(studio).toContain('sideBySide={splitView && !compact}');
    expect(studio).toContain("activePane={compact ? (surface === 'commands' ? 'primary' : 'panel') : undefined}");
    const chatStyles = source('components/studio/UnifiedEllieChat.module.css');
    expect(course).toMatch(/<UnifiedEllieChat\s+embedded\s+contentSized\b/);
    expect(course).not.toContain('h-[min(24rem,45dvh)]');
    expect(chatStyles).toMatch(/\.contentSized\s*\{[^}]*height:\s*auto/);
    expect(chatStyles).toMatch(/\.root\.contentSized\s+\.messagesViewport\s*\{[^}]*height:\s*clamp\(8rem,\s*32dvh,\s*20rem\)/);
    expect(course).not.toContain('h-[32rem]');
    expect(css).not.toContain('.studio-workspace :is(.text-xs, .text-sm');
    expect(css).toContain('font-size: 16px');
  });
});
