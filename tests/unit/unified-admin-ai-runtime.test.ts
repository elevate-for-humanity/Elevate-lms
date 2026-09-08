import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Unified Admin AI runtime', () => {
  it('routes outcomes through the durable plan-execute-evaluate path', () => {
    const chat = readFileSync('components/studio/UnifiedEllieChat.tsx', 'utf8');
    expect(chat).toContain('shouldOrchestrateMessage(command)');
    expect(chat).toContain('streamOrchestratedPlan(command, appendLine)');
    expect(chat).toContain('streamPlatformChat(');
    expect(chat).not.toContain('streamExecuteCommand(command');
  });
});
