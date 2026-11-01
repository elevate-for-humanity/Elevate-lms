import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const src = (path: string) => readFileSync(path, 'utf8');
describe('PARIS browser launch wiring', () => {
  it('registers launch and existing workflow tooling', () => {
    const r = src('lib/ai/tools/registry.ts');
    expect(r).toContain("name: 'browser.launch'");
    expect(r).toContain("path: '/api/admin/dev-studio/browser/session'");
    expect(r).toContain("name: 'browser.execute'");
    const browserExecute = r.slice(r.indexOf("name: 'browser.execute'"), r.indexOf("name: 'openhands.execute'"));
    expect(browserExecute).toContain("requiredInput: ['task']");
    expect(r).toContain("name: 'studio.runtime.exec'");
    expect(r).toContain("name: 'workflows.runTests'");
  });
  it('uses authenticated session creation instead of a fake browser session', () => {
    const x = src('lib/ai/tools/executor.ts');
    expect(x).toContain("if (tool.name === 'browser.launch')");
    expect(x).toContain("await import('@/apps/admin/app/api/admin/dev-studio/browser/session/route')");
    expect(src('apps/admin/app/api/admin/dev-studio/execute/route.ts')).toContain("tool: 'browser.launch'");
    expect(src('apps/admin/app/api/admin/dev-studio/browser/session/route.ts')).toContain('apiRequireDevStudio(req)');
  });
});
