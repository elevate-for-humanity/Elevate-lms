import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const FUNDING_SOURCES = [
  {
    name: 'WIOA',
    description: 'Workforce Innovation and Opportunity Act',
    icon: '🎯',
    color: 'bg-blue-600',
  },
  {
    name: 'Workforce Ready Grant',
    description: 'Indiana State Funding',
    icon: '🏛️',
    color: 'bg-emerald-600',
  },
  {
    name: 'Trade Adjustment Assistance',
    description: 'Federal TAA Program',
    icon: '⚡',
    color: 'bg-amber-600',
  },
  {
    name: 'Veterans Benefits',
    description: 'GI Bill & VA Programs',
    icon: '🎖️',
    color: 'bg-indigo-600',
  },
];

export function HomeFundingStrip() {
  return (
    <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-12 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1 bg-brand-red-600/20 text-brand-red-400 text-sm font-semibold rounded-full mb-4">
            💰 FUNDING AVAILABLE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Many Programs May Be{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              FREE
            </span>{' '}
            If You Qualify
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Don't let cost stop your career transformation. We help you find funding options that work for your situation.
          </p>
        </div>

        {/* Funding Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {FUNDING_SOURCES.map((source) => (
            <div
              key={source.name}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${source.color} text-2xl mb-3`}>
                {source.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{source.name}</h3>
              <p className="text-sm text-slate-400">{source.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/check-eligibility"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
          >
            Check Your Eligibility
            <span className="text-xl">→</span>
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            Free consultation • No commitment • Quick 2-minute process
          </p>
        </div>
      </div>
    </section>
  );
}
