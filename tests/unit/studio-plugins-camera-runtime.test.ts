import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { shouldOrchestrateMessage } from '../../lib/devstudio/ellie-message-router';

describe('Studio plugins, uploads and execution routing', () => {
  it('shows the existing integration manager in the Studio tool navigation', () => {
    const registry = readFileSync('lib/devstudio/workspace-registry.ts', 'utf8');
    expect(registry).toContain("label: 'Plugin Marketplace'");
    expect(registry).toContain("route: '/integrations'");
  });

  it('provides separate camera and file controls', () => {
    const chat = readFileSync('components/studio/UnifiedEllieChat.tsx', 'utf8');
    expect(chat).toContain('capture="environment"');
    expect(chat).toContain('>Files</span>');
    expect(chat).toContain('>Camera</span>');
  });

  it('speaks completed AI responses with a visible voice toggle', () => {
    const chat = readFileSync('components/studio/UnifiedEllieChat.tsx', 'utf8');
    expect(chat).toContain('speechSynthesis.speak(utterance)');
    expect(chat).toContain('Voice on');
    expect(chat).toContain('Turn voice output off');
  });

  it('treats scan and diagnose requests as executable work', () => {
    expect(shouldOrchestrateMessage('Scan the Store for errors')).toBe(true);
    expect(shouldOrchestrateMessage('Diagnose the Studio container')).toBe(true);
  });
});
