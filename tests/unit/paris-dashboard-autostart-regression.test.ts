import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const button = fs.readFileSync(path.resolve('components/paris/ParisFloatingButton.tsx'), 'utf8');
const chat = fs.readFileSync(path.resolve('components/paris/ParisChat.tsx'), 'utf8');
const platformShell = fs.readFileSync(path.resolve('components/platform/PlatformShell.tsx'), 'utf8');
const workspace = fs.readFileSync(
  path.resolve('components/program-holder/ProgramHolderWorkspaceView.tsx'),
  'utf8',
);

describe('PARIS dashboard introduction', () => {
  it('mounts and opens PARIS on the Program Holder dashboard', () => {
    expect(platformShell).toContain('<ParisFloatingWrapper');
    expect(platformShell).toContain('autoOpenOnDashboard={paris?.autoOpenOnDashboard ?? true}');
    expect(button).toContain("pathname.endsWith('/dashboard')");
  });

  it('greets the authenticated program holder by name', () => {
    expect(platformShell).toContain('personName={paris?.personName ?? user.full_name ?? user.first_name ?? null}');
    expect(chat).toContain("Hi${firstName ? ` ${firstName}` : ''} — I'm PARIS");
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
    expect(chat).toContain('void voice.play(plainTextForSpeech(greeting)');
    expect(chat).toContain('allowBrowserFallback: false');
  });

  it('renders assistant Markdown as compact, mobile-safe content', () => {
    expect(chat).toContain("import ReactMarkdown from 'react-markdown'");
    expect(chat).toContain('linkifyParisRoutes');
    expect(chat).toContain('!text-[15px] !leading-6');
    expect(chat).toContain('plainTextForSpeech');
    expect(chat).not.toContain('Check your device media volume');
  });

  it('routes live PARIS narration through the current Google speech adapter', () => {
    const route = fs.readFileSync(path.resolve('lib/ai/natural-voice-route.ts'), 'utf8');
    expect(route).toContain('generateGoogleNaturalVoice');
    expect(route).not.toContain('gpt-4o-mini-tts');
    expect(route).not.toContain('getOpenAIClient');
  });

  it('uses one shared speaker control instead of a second control on every response', () => {
    expect(chat).not.toContain('Play PARIS response aloud');
    expect(chat).not.toContain('Hear PARIS</button>');
    expect(chat).toContain(
      "voice.isPlaying || voice.isLoading ? 'Stop PARIS voice' : 'Hear PARIS'",
    );
  });

  it('keeps Home focused on tasks and compliance alerts', () => {
    expect(
      workspace.match(/<h2 className="font-black">Compliance Score<\/h2>/g) || [],
    ).toHaveLength(0);
    const home = workspace.slice(workspace.indexOf("// Home is an action queue."));
    expect(home).toContain('To-dos');
    expect(home).toContain('Alerts');
    expect(home).toContain('compliance');
    expect(home).not.toContain('Compliance {complianceScore}%');
    expect(workspace).not.toContain('title="Program readiness"');
  });
});
