/** Server-only, content-free tracing for Elevate's canonical AI execution paths. */
type Sdk = Pick<typeof import('@lmnr-ai/lmnr'), 'Laminar'>;
type Metadata = Record<string, unknown>;
type Environment = Record<string, string | undefined>;

async function localProjectKey(env: Environment): Promise<void> {
  if (env.NODE_ENV === 'production' || env.NODE_ENV === 'test' || env.LMNR_PROJECT_API_KEY) return;
  const [{ readFile }, { dirname, join }, { parseEnv }] = await Promise.all([
    import('node:fs/promises'), import('node:path'), import('node:util'),
  ]);
  let directory = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    try {
      await readFile(join(directory, 'pnpm-workspace.yaml'), 'utf8');
      for (const filename of ['.env.local', '.env']) {
        try {
          const values = parseEnv(await readFile(join(directory, filename), 'utf8'));
          if (values.LMNR_PROJECT_API_KEY?.trim()) {
            env.LMNR_PROJECT_API_KEY = values.LMNR_PROJECT_API_KEY.trim();
            return;
          }
        } catch { /* A local env file is optional. Never log its contents. */ }
      }
      return;
    } catch { /* Continue to the workspace root. */ }
    const parent = dirname(directory);
    if (parent === directory) return;
    directory = parent;
  }
}

function safeMetadata(metadata: Metadata): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of ['service', 'task', 'provider']) {
    const value = metadata[key];
    if (typeof value === 'string' && /^[a-z][a-z0-9_-]{0,63}$/.test(value)) result[key] = value;
  }
  return result;
}

function safeMetrics(metrics: Metadata): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  const names = { inputTokens: 'gen_ai.usage.input_tokens', outputTokens: 'gen_ai.usage.output_tokens', totalTokens: 'llm.usage.total_tokens' };
  for (const [key, attribute] of Object.entries(names)) {
    const value = metrics[key];
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) result[attribute] = value;
  }
  if (typeof metrics.model === 'string' && /^[a-zA-Z][a-zA-Z0-9_.:/-]{0,159}$/.test(metrics.model) && !metrics.model.includes('://')) {
    result['gen_ai.request.model'] = metrics.model;
  }
  return result;
}

export function createLaminarTracing({
  env = process.env,
  loadSdk = () => import('@lmnr-ai/lmnr'),
  loadLocalKey = localProjectKey,
}: {
  env?: Environment;
  loadSdk?: () => Promise<Sdk>;
  loadLocalKey?: (env: Environment) => Promise<void>;
} = {}) {
  let sdk: Sdk | undefined;
  let initialization: Promise<Sdk | undefined> | undefined;
  let warned = false;
  const warn = () => {
    if (!warned) console.warn('[laminar] Tracing unavailable; application execution continues.');
    warned = true;
  };
  async function initialize(service = env.ELEVATE_SERVICE || env.SERVICE_ROLE || 'application'): Promise<Sdk | undefined> {
    if (env.NEXT_RUNTIME === 'edge') return undefined;
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        await loadLocalKey(env);
        if (!env.LMNR_PROJECT_API_KEY?.trim()) return undefined;
        const loaded = await loadSdk();
        loaded.Laminar.initialize({
          projectApiKey: env.LMNR_PROJECT_API_KEY.trim(),
          // Explicit spans cover HTTP-based owned inference too. No provider
          // auto-patching: it can capture raw SDK exception bodies and inputs.
          instrumentModules: {},
          writeTrajectory: false,
          traceExportTimeoutMillis: 10_000,
          metadata: safeMetadata({ service }),
          release: env.GIT_SHA || env.BUILD_SHA || env.NEXT_PUBLIC_GIT_SHA,
        });
        sdk = loaded;
        const startup = sdk.Laminar.startSpan({ name: 'elevate.startup', metadata: safeMetadata({ service }) });
        startup.end();
        return sdk;
      } catch { warn(); return undefined; }
    })().then((loaded) => {
      // Secrets can become available after startup or recover after a transient
      // SDK failure. Cache a successful SDK, not permanent tracing disablement.
      if (!loaded) initialization = undefined;
      return loaded;
    });
    return initialization;
  }
  async function trace<T>(name: string, metadata: Metadata, operation: () => Promise<T>, metrics?: (result: T) => Metadata): Promise<T> {
    const active = await initialize();
    if (!active || !/^[a-z][a-z0-9_.-]{0,79}$/.test(name)) return operation();
    let execution: Promise<T> | undefined;
    const runOnce = () => execution ??= Promise.resolve().then(operation);
    let span: ReturnType<Sdk['Laminar']['startSpan']> | undefined;
    try {
      span = active.Laminar.startSpan({ name, spanType: name === 'ai.provider.chat' ? 'LLM' : 'DEFAULT', metadata: safeMetadata(metadata) });
      const current = span;
      await active.Laminar.withSpan(current, async () => {
        try {
          const result = await runOnce();
          try {
            current.setStatus({ code: 1 });
            if (metadata.provider && safeMetadata(metadata).provider) current.setAttribute('gen_ai.system', safeMetadata(metadata).provider);
            if (metrics) current.setAttributes(safeMetrics(metrics(result)));
          } catch { /* Telemetry must not change a completed operation. */ }
        } catch {
          // withSpan automatically records thrown exceptions, so keep the raw
          // business error on execution and only export its failure status.
          try { current.setStatus({ code: 2 }); } catch { /* Exporter failure. */ }
        }
      });
    } catch { warn(); }
    finally { try { span?.end(); } catch { warn(); } }
    // Reuse the same promise after any tracing failure. Preserve the original
    // result/error and never repeat an LLM call, write, or job execution.
    return runOnce();
  }
  async function flush(): Promise<void> { await sdk?.Laminar.flush(); }
  async function shutdown(): Promise<void> { await sdk?.Laminar.shutdown(); }
  async function* stream<T>(name: string, metadata: Metadata, operation: () => AsyncIterable<T>): AsyncIterable<T> {
    const active = await initialize();
    if (!active || !/^[a-z][a-z0-9_.-]{0,79}$/.test(name)) {
      yield* operation();
      return;
    }
    let span: ReturnType<Sdk['Laminar']['startSpan']> | undefined;
    try {
      span = active.Laminar.startSpan({ name, spanType: name === 'ai.provider.stream' ? 'LLM' : 'DEFAULT', metadata: safeMetadata(metadata) });
      const provider = safeMetadata(metadata).provider;
      if (provider) span.setAttribute('gen_ai.system', provider);
    } catch { warn(); }
    const current = span;
    // Each iterator operation has its own retained promise: a failure before or
    // after withSpan's callback must never consume the next chunk twice.
    async function invoke<R>(read: () => R | PromiseLike<R>): Promise<R> {
      let result: Promise<R> | undefined;
      const runOnce = () => result ??= Promise.resolve().then(read);
      if (current) {
        try {
          await active!.Laminar.withSpan(current, async () => {
            try { await runOnce(); }
            catch { /* Preserve the raw error outside the tracing callback. */ }
          });
        } catch { warn(); }
      }
      return runOnce();
    }
    let iterator: AsyncIterator<T> | undefined;
    let completed = false;
    let failed = false;
    try {
      iterator = await invoke(() => operation()[Symbol.asyncIterator]());
      while (true) {
        const next = await invoke(() => iterator!.next());
        if (next.done) { completed = true; return; }
        yield next.value;
      }
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      try {
        if (!completed && iterator) {
          try {
            const close = await invoke(() => iterator!.return);
            if (close) await invoke(() => close.call(iterator));
          }
          catch (error) {
            // A cleanup failure must not replace the original provider error.
            if (!failed) { failed = true; throw error; }
          }
        }
      } finally {
        try {
          current?.setAttribute('stream.completed', completed);
          current?.setStatus({ code: failed ? 2 : 1 });
        } catch { /* Telemetry must not change iterator completion. */ }
        try { current?.end(); } catch { warn(); }
      }
    }
  }
  return { initialize, trace, stream, flush, shutdown };
}

const key = Symbol.for('elevate.laminar.tracing');
const shared = globalThis as typeof globalThis & { [key]?: ReturnType<typeof createLaminarTracing> };
const tracing = shared[key] ??= createLaminarTracing();
export const initializeLaminar = tracing.initialize;
export const withLaminarSpan = tracing.trace;
export const withLaminarStream = tracing.stream;
export const flushLaminar = tracing.flush;
export const shutdownLaminar = tracing.shutdown;
