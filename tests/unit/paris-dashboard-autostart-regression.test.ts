import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const button = fs.readFileSync(path.resolve('components/paris/ParisFloatingButton.tsx'), 'utf8');
const chat = fs.readFileSync(path.resolve('components/paris/ParisChat.tsx'), 'utf8');
const holderLayout = fs.readFileSync(path.resolve('apps/lms/app/program-holder/layout.tsx'), 'utf8');
const workspace = fs.readFileSync(path.resolve('components/program-holder/ProgramHolderWorkspaceView.tsx'), 'utf8');

describe('PARIS dashboard introduction', () => {
  it('mounts and opens PARIS on the Program Holder dashboard', () => {
    expect(holderLayout).toContain('ParisFloatingWrapper');
    expect(holderLayout).toContain('autoOpenOnDashboard');
    expect(button).toContain("pathname.endsWith('/dashboard')");
  });

  it('introduces applicant interviewing and asks a first question', () => {
    expect(chat).toContain('interview new applicants');
    expect(chat).toContain('Which applicant or required compliance item should we work on first?');
  });

  it('speaks the opening greeting when PARIS is opened with voice enabled', () => {
    expect(chat).toContain('initialGreetingSpokenRef');
    expect(chat).toContain('if (!voiceEnabled || !autoSpeak || initialGreetingSpokenRef.current) return');
    expect(chat).toContain('void voice.play(greeting');
  });

  it('keeps one authoritative compliance summary on the dashboard', () => {
    expect(workspace.match(/<h2 className="font-black">Compliance Score<\/h2>/g) || []).toHaveLength(0);
    expect(workspace).toContain('Program readiness');
  });
});
