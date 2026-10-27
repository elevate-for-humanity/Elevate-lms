import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/platform/knowledge-graph', () => ({
  getKnowledgeGraphContext: vi.fn(() => 'canonical graph'),
}));
vi.mock('@/lib/platform/system-registry', () => ({
  getSystemRegistryContext: vi.fn(() => 'canonical registry'),
}));
import { buildAdminAiSystemPrompt } from '@/lib/platform/admin-ai-assistant';
import { getKnowledgeGraphContext } from '@/lib/platform/knowledge-graph';

describe('conversation-only private inference context', () => {
  it('retains identity and evidence rules without loading institutional catalogs', () => {
    const prompt = buildAdminAiSystemPrompt({
      contextProfile: 'conversation',
      institutionalContext: 'unused charter'.repeat(5000),
      lastUserMessage: 'Reply exactly READY; do not call tools.',
    });
    expect(prompt).toContain('You are PARIS');
    expect(prompt).toContain('Do not call tools');
    expect(prompt).toContain('Never claim a tool ran');
    expect(prompt.length).toBeLessThan(1500);
    expect(prompt).not.toContain('unused charter');
    expect(getKnowledgeGraphContext).not.toHaveBeenCalled();
  });

  it('retains the operational context path for diagnostic requests', () => {
    const prompt = buildAdminAiSystemPrompt({
      contextProfile: 'owned-cpu',
      lastUserMessage: 'Diagnose the website failure',
      fileContext: 'actual supplied file evidence',
    });
    expect(prompt).toContain('actual supplied file evidence');
    expect(prompt).toContain('Diagnostic response contract');
  });
});
