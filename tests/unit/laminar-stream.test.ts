import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, it, vi } from 'vitest';
import { createLaminarTracing } from '../../lib/observability/laminar';

function fixture(options: { key?: string; fail?: 'start' | 'before' | 'after' } = {}) {
  const spans: Array<Record<string, any>> = [];
  const context = new AsyncLocalStorage<Record<string, any>>();
  const api = {
    initialize: vi.fn(),
    startSpan: vi.fn((values: Record<string, any>) => {
      if (options.fail === 'start' && values.name !== 'elevate.startup') throw new Error('private-exporter-body');
      const span = { ...values, parent: context.getStore()?.name, attributes: {}, status: null as unknown,
        setAttribute(key: string, value: unknown) { Object.assign(this.attributes, { [key]: value }); },
        setStatus(value: unknown) { this.status = value; },
        end: vi.fn(), recordException: vi.fn(),
      };
      spans.push(span);
      return span;
    }),
    withSpan: vi.fn(async (span, fn) => {
      if (options.fail === 'before') throw new Error('private-exporter-body');
      const result = await context.run(span, async () => {
        try { return await fn(); }
        catch (error) { span.recordException(error); throw error; }
      });
      if (options.fail === 'after') throw new Error('private-exporter-body');
      return result;
    }),
    flush: vi.fn(), shutdown: vi.fn(),
  };
  const loadSdk = vi.fn(async () => ({ Laminar: api }) as never);
  const tracing = createLaminarTracing({
    env: { NODE_ENV: 'test', LMNR_PROJECT_API_KEY: options.key ?? 'test-project-key' },
    loadSdk, loadLocalKey: async () => {},
  });
  return { tracing, spans, api, context, loadSdk };
}

async function collect<T>(values: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of values) result.push(value);
  return result;
}

describe('Laminar streaming boundaries', () => {
  it('preserves chunk identity without loading the SDK when disabled', async () => {
    const { tracing, loadSdk } = fixture({ key: '' });
    const chunk = { privateOutput: 'private-student' };
    const operation = vi.fn(async function* () { yield chunk; });
    const result = await collect(tracing.stream('ai.provider.stream', {}, operation));
    expect(result[0]).toBe(chunk);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(loadSdk).not.toHaveBeenCalled();
  });

  it('holds a content-free LLM span open across yields and activates every read', async () => {
    const { tracing, spans, context } = fixture();
    const activeReads: Array<string | undefined> = [];
    const operation = vi.fn(async function* () {
      activeReads.push(context.getStore()?.name); yield 'private-prompt';
      activeReads.push(context.getStore()?.name); yield 'private-response';
      activeReads.push(context.getStore()?.name);
    });
    const iterator = tracing.stream('ai.provider.stream', { provider: 'elevate', prompt: 'private-input' }, operation)[Symbol.asyncIterator]();
    expect(await iterator.next()).toEqual({ value: 'private-prompt', done: false });
    const span = spans.find(item => item.name === 'ai.provider.stream')!;
    expect(span.end).not.toHaveBeenCalled();
    expect(await iterator.next()).toEqual({ value: 'private-response', done: false });
    expect(span.end).not.toHaveBeenCalled();
    expect((await iterator.next()).done).toBe(true);
    expect(activeReads).toEqual(['ai.provider.stream', 'ai.provider.stream', 'ai.provider.stream']);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(span.spanType).toBe('LLM');
    expect(span.metadata).toEqual({ provider: 'elevate' });
    expect(span.attributes).toEqual({ 'gen_ai.system': 'elevate', 'stream.completed': true });
    expect(span.status).toEqual({ code: 1 });
    expect(span.end).toHaveBeenCalledTimes(1);
    expect(span.recordException).not.toHaveBeenCalled();
    expect(JSON.stringify(span)).not.toContain('private-');
  });

  it('returns the source iterator once under its span on an early consumer break', async () => {
    const { tracing, spans, context } = fixture();
    const returned = vi.fn();
    const operation = async function* () {
      try { yield 'one'; yield 'two'; }
      finally { returned(context.getStore()?.name); }
    };
    for await (const value of tracing.stream('ai.provider.stream', {}, operation)) { expect(value).toBe('one'); break; }
    const span = spans.find(item => item.name === 'ai.provider.stream')!;
    expect(returned).toHaveBeenCalledExactlyOnceWith('ai.provider.stream');
    expect(span.attributes['stream.completed']).toBe(false);
    expect(span.end).toHaveBeenCalledTimes(1);
  });

  it.each(['start', 'before', 'after'] as const)('never consumes a chunk twice after %s tracing failure', async fail => {
    const { tracing } = fixture({ fail });
    let reads = 0;
    const operation = vi.fn(() => ({
      [Symbol.asyncIterator]() { return { next: async () => ++reads <= 2 ? { value: reads, done: false as const } : { value: undefined, done: true as const } }; },
    }));
    expect(await collect(tracing.stream('ai.provider.stream', {}, operation))).toEqual([1, 2]);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(reads).toBe(3);
  });

  it('preserves the original source error even when cleanup also rejects, without recording raw errors', async () => {
    const { tracing, spans } = fixture();
    const original = new Error('private-student private-provider-response');
    const next = vi.fn(async () => { throw original; });
    const returned = vi.fn(async () => { throw new Error('private-cleanup'); });
    await expect(collect(tracing.stream('ai.provider.stream', {}, () => ({
      [Symbol.asyncIterator]() { return { next, return: returned }; },
    })))).rejects.toBe(original);
    const span = spans.find(item => item.name === 'ai.provider.stream')!;
    expect(next).toHaveBeenCalledTimes(1);
    expect(returned).toHaveBeenCalledTimes(1);
    expect(span.recordException).not.toHaveBeenCalled();
    expect(span.status).toEqual({ code: 2 });
    expect(span.end).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(span)).not.toContain('private-');
  });

  it('preserves a creation error and a cancellation cleanup error by identity', async () => {
    for (const phase of ['create', 'return']) {
      const { tracing, spans } = fixture();
      const error = new Error('private-error');
      const values = tracing.stream('ai.provider.stream', {}, () => {
        if (phase === 'create') throw error;
        return { [Symbol.asyncIterator]() { return { next: async () => ({ value: 'one', done: false as const }), return: async () => { throw error; } }; } };
      });
      const iterator = values[Symbol.asyncIterator]();
      if (phase === 'create') await expect(iterator.next()).rejects.toBe(error);
      else { await iterator.next(); await expect(iterator.return!()).rejects.toBe(error); }
      const span = spans.find(item => item.name === 'ai.provider.stream')!;
      expect(span.recordException).not.toHaveBeenCalled();
      expect(span.end).toHaveBeenCalledTimes(1);
    }
  });

  it('retains business rejection when withSpan fails after reading the iterator', async () => {
    const { tracing } = fixture({ fail: 'after' });
    const error = new Error('private-provider-body');
    const operation = vi.fn(async function* () { throw error; });
    await expect(collect(tracing.stream('ai.provider.stream', {}, operation))).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('keeps concurrent streaming children beneath their own task roots', async () => {
    const { tracing, spans } = fixture();
    await Promise.all(['alpha', 'beta'].map(name => tracing.trace(name, {}, async () => collect(tracing.stream(name + '.stream', {}, async function* () {
      yield name;
      await Promise.resolve();
      yield name;
    })))));
    expect(spans.find(item => item.name === 'alpha.stream')?.parent).toBe('alpha');
    expect(spans.find(item => item.name === 'beta.stream')?.parent).toBe('beta');
  });
});
