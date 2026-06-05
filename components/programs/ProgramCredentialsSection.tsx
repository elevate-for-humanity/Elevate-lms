'use client';

import { Award, ExternalLink } from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { formatCredentialAuthorityLine } from '@/lib/programs/format-credential';

export default function ProgramCredentialsSection({ program }: { program: ProgramSchema }) {
  if (!program.credentials?.length) return null;

  return (
    <section className="py-12 bg-white border-b border-slate-100" aria-labelledby="credentials-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 id="credentials-heading" className="text-2xl font-extrabold text-slate-900 mb-2">
          Credentials You Earn
        </h2>
        <p className="text-slate-600 text-sm mb-8 max-w-2xl">
          Each credential is issued by its certifying authority upon passing required exams or
          completing supervised hours — not by Elevate.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {program.credentials.map((c) => (
            <article
              key={c.name}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col"
            >
              <div className="flex items-start gap-2 mb-2">
                <Award className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" aria-hidden />
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{c.name}</h3>
              </div>
              <p className="text-xs font-semibold text-brand-blue-800 mb-2">
                {formatCredentialAuthorityLine(c)}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">{c.description}</p>
              {c.validity ? (
                <p className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-200">
                  Validity: {c.validity}
                </p>
              ) : null}
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" aria-hidden />
          <a href="/compliance" className="text-brand-blue-700 font-semibold hover:underline">
            Full credential disclosure and issuing-authority mapping
          </a>
        </p>
      </div>
    </section>
  );
}
