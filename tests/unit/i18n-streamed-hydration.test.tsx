import React, { act, lazy, Suspense, useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from '@/lib/i18n/context';

function Portal({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  return <main data-portal-shell>Secure workspace <span>{locale}</span>{children}</main>;
}

function PortalContent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Saved actions: {count}</button>;
}

beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); });
afterEach(() => { vi.restoreAllMocks(); document.cookie = 'NEXT_LOCALE=;path=/;max-age=0'; vi.unstubAllGlobals(); });

function LanguageControls() {
  const { locale, setLocale, t } = useI18n();
  return <div><output>{locale}: {t('common.save')}</output><button onClick={() => setLocale('es')}>Spanish</button></div>;
}

describe('locale restoration during streamed portal hydration', () => {
  it.each(['en', 'es', 'fr'])('preserves the server-rendered workspace while %s locale restores and a client chunk is still loading', async (locale) => {
    document.cookie = `NEXT_LOCALE=${locale};path=/`;
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(<I18nProvider><Suspense fallback={<p>Loading portal</p>}><Portal><PortalContent /></Portal></Suspense></I18nProvider>);
    let finishChunk!: (module: { default: typeof PortalContent }) => void;
    const chunk = new Promise<{ default: typeof PortalContent }>((resolve) => { finishChunk = resolve; });
    const DelayedContent = lazy(() => chunk);
    const recoverable = vi.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, <I18nProvider><Suspense fallback={<p>Loading portal</p>}><Portal><DelayedContent /></Portal></Suspense></I18nProvider>, { onRecoverableError: recoverable });
      });
      expect(container.querySelector('[data-portal-shell]')).not.toBeNull();
      expect(container.querySelector('[data-portal-shell]')!.textContent).toContain('Secure workspace');
      expect(container.textContent).not.toContain('Loading portal');
      await act(async () => { finishChunk({ default: PortalContent }); await chunk; });
      expect(container.querySelector('[data-portal-shell] span')?.textContent).toBe(locale);
      await act(async () => { container.querySelector('button')!.click(); });
      expect(container.querySelector('button')?.textContent).toBe('Saved actions: 1');
      expect(recoverable).not.toHaveBeenCalled();
    } finally {
      await act(async () => { finishChunk({ default: PortalContent }); await chunk; root?.unmount(); });
      container.remove();
    }
  });

  it('updates all consumers in one provider and preserves independent portal roots', async () => {
    const container = document.createElement('div'); document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => { root.render(<><I18nProvider><LanguageControls /><LanguageControls /></I18nProvider><I18nProvider><LanguageControls /></I18nProvider></>); });
      await act(async () => { container.querySelector('button')!.click(); });
      expect([...container.querySelectorAll('output')].map((node) => node.textContent)).toEqual(['es: Guardar', 'es: Guardar', 'en: Save']);
      expect(document.cookie).toContain('NEXT_LOCALE=es');
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it('keeps language selection usable when the browser blocks preference storage', async () => {
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    const container = document.createElement('div'); document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => { root.render(<I18nProvider><LanguageControls /></I18nProvider>); });
      expect(container.querySelector('output')?.textContent).toBe('en: Save');
      await act(async () => { container.querySelector('button')!.click(); });
      expect(container.querySelector('output')?.textContent).toBe('es: Guardar');
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
