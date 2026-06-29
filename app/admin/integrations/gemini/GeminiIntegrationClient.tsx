'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Send, Zap } from 'lucide-react';

interface UsedIn {
  surface: string;
  route: string;
  description: string;
}

interface Props {
  hasKey: boolean;
  hasOpenAI: boolean;
  hasAzure: boolean;
  activeProvider: string;
  preferredEnv: string;
  usedIn: UsedIn[];
}

export default function GeminiIntegrationClient({
  hasKey,
  hasOpenAI,
  hasAzure,
  activeProvider,
  preferredEnv,
  usedIn,
}: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    response?: string;
    provider?: string;
    error?: string;
  } | null>(null);

  async function runTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/integrations/gemini/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: 'Request failed' });
    } finally {
      setTesting(false);
    }
  }

  const isGeminiActive = activeProvider.startsWith('gemini');

  return (
    <div className="mt-6 space-y-4">
      {/* Provider status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Provider Status</h2>
          <button
            onClick={runTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue-700 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-800 disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {testing ? 'Testing…' : 'Test AI'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Gemini', configured: hasKey, key: 'GEMINI_API_KEY' },
            { label: 'OpenAI', configured: hasOpenAI, key: 'OPENAI_API_KEY' },
            { label: 'Azure OpenAI', configured: hasAzure, key: 'AZURE_OPENAI_API_KEY' },
          ].map((p) => (
            <div key={p.label} className="border border-slate-100 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                {p.configured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className="text-sm font-medium text-slate-700">{p.label}</span>
              </div>
              <p className="text-xs text-slate-400">{p.configured ? 'Key set' : p.key}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3">
          <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Active provider: <span className="text-blue-600">{activeProvider}</span>
            </p>
            <p className="text-xs text-slate-400">
              Preferred:{' '}
              <code className="bg-slate-200 px-1 rounded">AI_PROVIDER={preferredEnv}</code>
              {' · '}Fallback chain: openai → gemini → azure
            </p>
          </div>
        </div>

        {testResult && (
          <div
            className={`mt-3 rounded-lg px-4 py-3 text-sm ${testResult.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
          >
            {testResult.ok ? (
              <div>
                <p className="font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> AI is working · Provider:{' '}
                  {testResult.provider}
                </p>
                {testResult.response && (
                  <p className="mt-1 text-xs opacity-80 italic">"{testResult.response}"</p>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {testResult.error || 'AI test failed. Check your API keys.'}
              </p>
            )}
          </div>
        )}

        {!hasKey && !hasOpenAI && !hasAzure && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            No AI provider is configured. Set{' '}
            <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> to enable Gemini, or{' '}
            <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> for OpenAI.
          </div>
        )}
      </div>

      {/* Where it's used */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Used In</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Platform surfaces powered by the active AI provider
          </p>
        </div>
        <ul className="divide-y divide-slate-50">
          {usedIn.map((item) => (
            <li key={item.route} className="px-6 py-4 flex items-start gap-3">
              <CheckCircle2
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${hasKey || hasOpenAI || hasAzure ? 'text-green-500' : 'text-slate-300'}`}
              />
              <div>
                <p className="text-sm font-medium text-slate-900">{item.surface}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
                <code className="text-xs text-slate-300">{item.route}</code>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Set Gemini as preferred */}
      {!isGeminiActive && hasKey && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium">Gemini key is set but not the active provider.</p>
          <p className="mt-1 text-blue-600">
            Set <code className="bg-blue-100 px-1 rounded">AI_PROVIDER=gemini</code> in your
            environment to use Gemini as the primary provider.
          </p>
        </div>
      )}
    </div>
  );
}
