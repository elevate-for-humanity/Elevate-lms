import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const button = fs.readFileSync(path.resolve('components/paris/ParisFloatingButton.tsx'), 'utf8');
const chat = fs.readFileSync(path.resolve('components/paris/ParisChat.tsx'), 'utf8');
const lmsLayout = fs.readFileSync(path.resolve('apps/lms/app/layout.tsx'), 'utf8');
const universalParis = fs.readFileSync(
  path.resolve('components/paris/UniversalDashboardParis.tsx'),
  'utf8',
);
const workspace = fs.readFileSync(
  path.resolve('components/program-holder/ProgramHolderWorkspaceView.tsx'),
  'utf8',
);

describe('PARIS dashboard introduction', () => {
  it('mounts and opens PARIS on the Program Holder dashboard', () => {
    expect(lmsLayout).toContain('UniversalDashboardParis');
    expect(universalParis).toContain("prefix: '/program-holder'");
    expect(universalParis).toContain('autoOpenOnDashboard');
    expect(button).toContain("pathname.endsWith('/dashboard')");
  });

  it('introduces applicant interviewing and asks a first question', () => {
    expect(chat).toContain('interview new applicants');
    expect(chat).toContain('Which applicant or required compliance item should we work on first?');
  });

  it('speaks the opening greeting when PARIS is opened with voice enabled', () => {
    expect(chat).toContain('initialGreetingSpokenRef');
    expect(chat).toContain(
      'if (!voiceEnabled || !autoSpeak || initialGreetingSpokenRef.current) return',
    );
    expect(chat).toContain('void voice.play(greeting');
    expect(chat).toContain('allowBrowserFallback: true');
  });

  it('uses one shared speaker control instead of a second control on every response', () => {
    expect(chat).not.toContain('Play PARIS response aloud');
    expect(chat).not.toContain('Hear PARIS</button>');
    expect(chat).toContain(
      "voice.isPlaying || voice.isLoading ? 'Stop PARIS voice' : 'Hear PARIS'",
    );
  });

  it('keeps one authoritative compliance summary on the dashboard', () => {
    expect(
      workspace.match(/<h2 className="font-black">Compliance Score<\/h2>/g) || [],
    ).toHaveLength(0);
    expect(workspace).toContain('Program readiness');
  });
});
