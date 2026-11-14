'use client';

import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';

interface Props {
  content: string;
}

type Lang = 'en' | 'es';

const LANG_LABELS: Record<Lang, string> = { en: 'English', es: 'Español' };

export function TranslateToggle({ content }: Props) {
  const [activeLang, setActiveLang] = useState<Lang>('en');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function switchTo(lang: Lang) {
    if (lang === activeLang) return;

    if (lang === 'en') {
      setActiveLang('en');
      return;
    }

    // Already translated — just switch
    if (translated) {
      setActiveLang(lang);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lms/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, targetLang: lang }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setTranslated(data.translated);
      setActiveLang(lang);
    } catch {
      setError('Translation unavailable. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {/* Toggle bar */}
      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <Languages className="w-4 h-4 text-slate-400 ml-1 mr-0.5" />
        {(['en', 'es'] as Lang[]).map((lang) => (
          <button
            key={lang}
            onClick={() => switchTo(lang)}
            disabled={loading}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
              activeLang === lang
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {loading && lang !== 'en' && lang !== activeLang ? (
              <Loader2 className="w-3 h-3 animate-spin inline" />
            ) : (
              LANG_LABELS[lang]
            )}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Translated content — shown only when non-English is active */}
      {activeLang !== 'en' && translated && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {LANG_LABELS[activeLang]}
          </p>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {translated}
          </div>
        </div>
      )}
    </div>
  );
}
