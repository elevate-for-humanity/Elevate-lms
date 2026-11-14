import { describe, expect, it } from 'vitest';
import {
  buildAdminAiSystemPrompt,
  isOperationalDiagnosticRequest,
} from '@/lib/platform/admin-ai-assistant';

describe('admin AI assistant guardrails', () => {
  it('detects operational diagnostic requests', () => {
    expect(isOperationalDiagnosticRequest('Why is the Barber hero banner broken?')).toBe(true);
    expect(isOperationalDiagnosticRequest('List all active programs')).toBe(false);
  });

  it('requires evidence boundaries and structured diagnostics', () => {
    const prompt = buildAdminAiSystemPrompt({
      lastUserMessage: 'Diagnose the barber hero banner failure',
      ragContext: 'Hero banners use components/marketing/HeroVideo.tsx',
      automaticEvidence:
        '### search_code {"query":"HeroVideo"}\ncomponents/marketing/HeroVideo.tsx:1',
      toolInventory: ['inspect_route', 'search_code', 'query_program_by_slug'],
    });

    expect(prompt).toContain('Never claim to have investigated');
    expect(prompt).toContain('No live tool was executed');
    expect(prompt).toContain('Only a successful scan_live_page result proves browser');
    expect(prompt).toContain('do not convert the failure into a clean bill of health');
    expect(prompt).toContain('Problem:');
    expect(prompt).toContain('Evidence used:');
    expect(prompt).toContain('Likely causes:');
    expect(prompt).toContain('Affected files/routes/tables:');
    expect(prompt).toContain('components/marketing/HeroVideo.tsx');
    expect(prompt).toContain('inspect_route');
  });

  it('injects platform architecture context instead of a generic assistant prompt', () => {
    const prompt = buildAdminAiSystemPrompt({
      lastUserMessage: 'What should I check?',
      toolInventory: ['inspect_platform_registry'],
    });

    expect(prompt).toContain('unified platform orchestrator');
    expect(prompt).toContain('All registered Studio agents are internal capabilities');
    expect(prompt).toContain('proxy.ts only');
    expect(prompt).toContain('/lms/courses/[courseId]/lessons/[lessonId]');
    expect(prompt).not.toContain('You are a helpful AI assistant');
  });
});
