import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, it, vi } from 'vitest';
import { createLaminarTracing } from '../../lib/observability/laminar';

function fixture(options: { key?: string; fail?: 'initialize' | 'start' | 'after'; edge?: boolean } = {}) {
  const spans: Array<Record<string, any>> = [];
  const context = new AsyncLocalStorage<Record<string, any>>();
  const api = {
    initialize: vi.fn(() => { if (options.fail === 'initialize') throw new Error('private-key'); }),
    startSpan: vi.fn((values: Record<string, any>) => {
      if (options.fail === 'start') throw new Error('private-exporter-response');
      const span = { ...values, parent: context.getStore()?.name, status: null as unknown, attributes: {},
        setStatus(value: unknown) { this.status = value; },
        setAttribute(key: string, value: unknown) { Object.assign(this.attributes, { [key]: value }); },
        setAttributes(values: object) { Object.assign(this.attributes, values); },
        end: vi.fn(), recordException: vi.fn(),
      };
      spans.push(span);
      return span;
    }),
    withSpan: vi.fn(async (span, fn) => context.run(span, async () => {
      try {
        const value = await fn();
        if (options.fail === 'after') throw new Error('private-exporter-response');
        return value;
      } catch (error) { span.recordException(error); throw error; }
    })),
    flush: vi.fn(), shutdown: vi.fn(),
  };
  const load = vi.fn(async () => ({ Laminar: api }) as never);
  const env = { NODE_ENV: 'production', LMNR_PROJECT_API_KEY: options.key ?? 'fixture-project-key', NEXT_RUNTIME: options.edge ? 'edge' : 'nodejs' };
  const tracing = createLaminarTracing({
    env,
    loadSdk: load, loadLocalKey: async () => {},
  });
  return { tracing, spans, load, api, env };
}

describe('Laminar instrumentation boundaries', () => {
  it('does not load tracing without a key or in the Edge runtime', async () => {
    for (const options of [{ key: '' }, { edge: true }]) {
      const { tracing, load } = fixture(options);
      const result = {};
      expect(await tracing.trace('ai.chat', {}, async () => result)).toBe(result);
      expect(load).not.toHaveBeenCalled();
    }
  });
  it('initializes once under concurrent calls and disables automatic content/exception capture', async () => {
    const { tracing, api, load } = fixture();
    await Promise.all([tracing.initialize('admin'), tracing.initialize('admin')]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(api.initialize).toHaveBeenCalledTimes(1);
    expect(api.initialize).toHaveBeenCalledWith(expect.objectContaining({ instrumentModules: {}, writeTrajectory: false }));
  });
  it('enables tracing when the project key becomes available after startup', async () => {
    const { tracing, load, env, spans } = fixture({ key: '' });
    await tracing.initialize();
    expect(load).not.toHaveBeenCalled();
    env.LMNR_PROJECT_API_KEY = 'fixture-refreshed-key';
    await tracing.trace('ai.chat', {}, async () => 'ready');
    expect(load).toHaveBeenCalledTimes(1);
    expect(spans.some(span => span.name === 'ai.chat')).toBe(true);
  });
  it('recovers from a transient SDK initialization failure', async () => {
    const { tracing, api } = fixture();
    api.initialize.mockImplementationOnce(() => { throw new Error('private-transient-error'); });
    await tracing.initialize();
    await tracing.trace('ai.chat', {}, async () => 'ready');
    expect(api.initialize).toHaveBeenCalledTimes(2);
  });
  it('preserves the original result and exports only allowlisted metadata and usage', async () => {
    const { tracing, spans } = fixture();
    const result = { privateResponse: 'private-response' };
    expect(await tracing.trace('ai.provider.chat', { provider: 'elevate', userId: 'private-student', prompt: 'private-prompt' }, async () => result,
      () => ({ model: 'owned-model', inputTokens: 2, outputTokens: 3, totalTokens: 5, secret: 'private-token' }))).toBe(result);
    const span = spans.find(s => s.name === 'ai.provider.chat')!;
    expect(span.spanType).toBe('LLM');
    expect(span.metadata).toEqual({ provider: 'elevate' });
    expect(span.attributes).toEqual({ 'gen_ai.system': 'elevate', 'gen_ai.request.model': 'owned-model', 'gen_ai.usage.input_tokens': 2, 'gen_ai.usage.output_tokens': 3, 'llm.usage.total_tokens': 5 });
    expect(JSON.stringify(span)).not.toContain('private-');
    expect(span.end).toHaveBeenCalledTimes(1);
  });
  it('marks failure without exposing raw exception details and rethrows the exact original error', async () => {
    const { tracing, spans } = fixture();
    const error = new Error('private-student private-token private-provider-body');
    await expect(tracing.trace('ai.chat', {}, async () => { throw error; })).rejects.toBe(error);
    const span = spans.find(s => s.name === 'ai.chat')!;
    expect(span.status).toEqual({ code: 2 });
    expect(span.recordException).not.toHaveBeenCalled();
    expect(JSON.stringify(span)).not.toContain('private-');
    expect(span.end).toHaveBeenCalledTimes(1);
  });
  it.each(['initialize', 'start', 'after'] as const)('executes business work exactly once after %s instrumentation failure', async fail => {
    const { tracing } = fixture({ fail });
    const operation = vi.fn(async () => ({ success: true }));
    expect(await tracing.trace('ai.chat', {}, operation)).toEqual({ success: true });
    expect(operation).toHaveBeenCalledTimes(1);
  });
  it('retains original business rejection when the exporter also fails', async () => {
    const { tracing } = fixture({ fail: 'after' });
    const original = new Error('original-private-error');
    const operation = vi.fn(async () => { throw original; });
    await expect(tracing.trace('ai.chat', {}, operation)).rejects.toBe(original);
    expect(operation).toHaveBeenCalledTimes(1);
  });
  it('keeps concurrent task trees isolated', async () => {
    const { tracing, spans } = fixture();
    await Promise.all(['alpha', 'beta'].map(name => tracing.trace(name, {}, async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return tracing.trace(name + '.provider', {}, async () => name);
    })));
    expect(spans.find(s => s.name === 'alpha.provider')?.parent).toBe('alpha');
    expect(spans.find(s => s.name === 'beta.provider')?.parent).toBe('beta');
  });
});
