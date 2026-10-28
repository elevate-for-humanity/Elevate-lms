'use client';
import { useEffect, useRef, useState } from 'react';
import { scormSeconds } from '@/lib/career/job-ready';

type Props = {
  slug: string;
  title: string;
  initialCmi: Record<string, string>;
  learnerId: string;
  learnerName: string;
};

export function JobReadyPlayer({ slug, title, initialCmi, learnerId, learnerName }: Props) {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('Your progress will save as you learn.');
  const [loaded, setLoaded] = useState(false);
  const retry = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    // Hydrate before the iframe mounts. A synchronous SCORM Initialize must
    // never race an asynchronous fetch and overwrite a returning learner.
    const cmi: Record<string, string> = {
      'cmi._version': '1.0',
      'cmi.mode': 'normal',
      'cmi.credit': 'credit',
      'cmi.completion_status': 'unknown',
      'cmi.success_status': 'unknown',
      'cmi.total_time': 'PT0S',
      'cmi.scaled_passing_score': '0.8',
      'cmi.interactions._count': '0',
      'cmi.objectives._count': '0',
      'cmi.comments_from_learner._count': '0',
      'cmi.comments_from_lms._count': '0',
      ...initialCmi,
      'cmi.session_time': 'PT0S',
      'cmi.learner_id': learnerId,
      'cmi.learner_name': learnerName,
      'cmi.entry':
        initialCmi['cmi.suspend_data'] || initialCmi['cmi.location'] ? 'resume' : 'ab-initio',
    };
    let initialized = false;
    let terminated = false;
    let error = '0';
    let dirty = false;
    let disposed = false;
    let revision = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = Promise.resolve();
    const endpoint = `/api/learner/job-ready/${slug}`;
    const save = () => {
      if (!dirty) return pending;
      const total =
        scormSeconds(initialCmi['cmi.total_time']) + scormSeconds(cmi['cmi.session_time']);
      const payload = JSON.stringify({ cmi: { ...cmi, 'cmi.total_time': `PT${total}S` } });
      const version = revision;
      pending = pending.then(async () => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          });
          if (!response.ok) throw new Error();
          if (revision === version) dirty = false;
          if (!disposed)
            setMessage(
              revision === version
                ? 'Progress saved. You can return to this module later.'
                : 'Saving your latest progress…',
            );
        } catch {
          if (!disposed)
            setMessage('Progress has not saved. Keep this page open and select Retry save.');
        }
      });
      return pending;
    };
    retry.current = save;
    const api = {
      Initialize: () => {
        if (initialized || terminated) {
          error = initialized ? '103' : '104';
          return 'false';
        }
        initialized = true;
        error = '0';
        return 'true';
      },
      GetValue: (key: string) => {
        if (!initialized || terminated) {
          error = terminated ? '123' : '122';
          return '';
        }
        error = '0';
        if (key.startsWith('adl.nav.request_valid.')) return 'true';
        // Rustici dispatch uses the indexed collection counts during resume.
        if (key.endsWith('._count')) {
          const prefix = key.slice(0, -6);
          const indexes = Object.keys(cmi)
            .filter((k) => k.startsWith(prefix))
            .map((k) => Number(k.slice(prefix.length).split('.')[0]))
            .filter(Number.isInteger);
          return String(indexes.length ? Math.max(...indexes) + 1 : Number(cmi[key] || 0));
        }
        return cmi[key] ?? '';
      },
      SetValue: (key: string, value: string) => {
        if (!initialized || terminated) {
          error = terminated ? '133' : '132';
          return 'false';
        }
        if (key === 'adl.nav.request') {
          error = '0';
          return 'true';
        }
        if (
          !/^cmi\.[\w.]+$/.test(key) ||
          [
            'cmi.learner_id',
            'cmi.learner_name',
            'cmi.entry',
            'cmi.mode',
            'cmi.credit',
            'cmi._version',
            'cmi.total_time',
          ].includes(key)
        ) {
          error = '404';
          return 'false';
        }
        cmi[key] = String(value);
        dirty = true;
        revision++;
        error = '0';
        clearTimeout(timer);
        timer = setTimeout(() => void save(), 3000);
        return 'true';
      },
      Commit: () => {
        if (!initialized || terminated) {
          error = terminated ? '143' : '142';
          return 'false';
        }
        error = '0';
        void save();
        return 'true';
      },
      Terminate: () => {
        if (!initialized || terminated) {
          error = terminated ? '113' : '112';
          return 'false';
        }
        terminated = true;
        error = '0';
        void save();
        return 'true';
      },
      GetLastError: () => error,
      GetErrorString: (code: string) => (code === '0' ? 'No error' : 'SCORM session or data error'),
      GetDiagnostic: () => error,
    };
    const host = window as unknown as { API_1484_11?: typeof api };
    const previous = host.API_1484_11;
    host.API_1484_11 = api;
    setReady(true);
    const interval = setInterval(() => void save(), 15_000);
    const flush = () => {
      void save();
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', visibility);
    const timeout = setTimeout(() => {
      if (!disposed)
        setMessage(
          'If the lesson is blank or reports an access error, use Request help below. Progress is saved only after the lesson reports it.',
        );
    }, 30_000);
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', visibility);
      void save();
      if (host.API_1484_11 === api) host.API_1484_11 = previous;
      retry.current = null;
    };
  }, [slug, initialCmi, learnerId, learnerName]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 p-4">
        <p role="status" className="max-w-2xl leading-7 text-slate-800">
          {message}
        </p>
        <button
          type="button"
          onClick={() => void retry.current?.()}
          className="min-h-12 rounded-lg border border-slate-400 bg-white px-4 py-2 font-bold text-slate-950"
        >
          Retry save
        </button>
      </div>
      {!loaded && <p role="status">Loading Job Ready content…</p>}
      {ready && (
        <iframe
          title={title}
          src={`/scorm/job-ready/${slug}/dispatch.html`}
          onLoad={() => setLoaded(true)}
          className="h-[75vh] min-h-[480px] w-full rounded-xl border border-slate-300 bg-white"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}
    </div>
  );
}
