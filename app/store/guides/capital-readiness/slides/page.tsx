export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Download, Presentation } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Capital Readiness Slide Deck | Elevate Store',
  description: 'Presentation slides for the Elevate Capital Readiness Framework.',
};

const slides = [
  {
    id: 1,
    title: 'The Elevate Capital Readiness Framework',
    content: 'Build trust before you chase capital.',
    type: 'title',
  },
  {
    id: 2,
    title: 'The Problem',
    content: "Most organizations don't fail.\nThey stall.\nBecause trust erodes before money runs out.",
    type: 'statement',
  },
  {
    id: 3,
    title: 'The Misconception',
    content: 'Eligibility ≠ Readiness\nApproval ≠ Sustainability\nFunding ≠ Stability',
    type: 'contrast',
  },
  {
    id: 4,
    title: 'What Institutions Actually Ask',
    content: 'Can this organization:\n• Explain itself clearly?\n• Absorb money without chaos?\n• Survive scrutiny?',
    type: 'list',
  },
  {
    id: 5,
    title: 'Capital Is a Trust System',
    content: 'Capital follows:\n• Predictability\n• Documentation\n• Discipline\n• Explainability',
    type: 'list',
  },
  {
    id: 6,
    title: 'The Three Readiness Levels',
    content: 'Level 1: Informal (people-based)\nLevel 2: Documented (process-based)\nLevel 3: Institutional (system-based)',
    type: 'levels',
  },
  {
    id: 7,
    title: 'The First Gate',
    content: 'If the business cannot stand alone,\nit cannot scale.\n\n(Separation of personal and business risk)',
    type: 'statement',
  },
  {
    id: 8,
    title: 'Credit Is Not Cash',
    content: 'Credit is a reputation system.\nSpeed kills trust.\nBoring wins.',
    type: 'statement',
  },
  {
    id: 9,
    title: 'Banking & Tax Signals',
    content: 'Your bank account and filings tell a story.\nInstitutions believe that story.',
    type: 'statement',
  },
  {
    id: 10,
    title: 'Public Funding Reality',
    content: 'Approval gets you in.\nReadiness keeps you in.',
    type: 'contrast',
  },
  {
    id: 11,
    title: 'Growth Reveals Cracks',
    content: 'Growth does not fix systems.\nIt exposes them.',
    type: 'statement',
  },
  {
    id: 12,
    title: 'The Elevate Model',
    content: 'Education → Compliance → Capital → Sustainability',
    type: 'model',
  },
  {
    id: 13,
    title: 'Why This Works',
    content: 'Because it aligns with how institutions already think.',
    type: 'statement',
  },
  {
    id: 14,
    title: 'Your Next Move',
    content: 'Stop chasing capital.\nStart building trust.',
    type: 'cta',
  },
  {
    id: 15,
    title: 'Elevate for Humanity',
    content: 'Capital Readiness is Infrastructure.',
    type: 'close',
  },
];

export default async function CapitalReadinessSlidesPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('products').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/store/guides/capital-readiness" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>
          <div className="flex items-center gap-4">
            <Presentation className="w-5 h-5 text-brand-blue-400" />
            <span className="font-semibold">Capital Readiness Slide Deck</span>
          </div>
          <Link 
            href="/contact"
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 rounded-lg text-sm font-medium hover:bg-brand-blue-700"
          >
            <Download className="w-4 h-4" />
            Request PPTX
          </Link>
        </div>
      </header>

      {/* Slides */}
      <main className="py-12">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className="bg-slate-100 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Slide Number */}
              <div className="bg-slate-100/50 px-6 py-2 flex items-center justify-between">
                <span className="text-sm text-slate-600">Slide {slide.id} of {slides.length}</span>
                <span className="text-xs text-slate-600 uppercase tracking-wide">{slide.type}</span>
              </div>
              
              {/* Slide Content */}
              <div className="aspect-video flex flex-col items-center justify-center p-12 text-center">
                <h2 className={`font-bold mb-6 ${slide.type === 'title' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
                  {slide.title}
                </h2>
                <div className="text-xl md:text-2xl text-slate-700 whitespace-pre-line max-w-3xl">
                  {slide.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Need the Full Presentation?</h3>
          <p className="text-slate-600 mb-6">
            Get the PowerPoint/Keynote version with speaker notes for board meetings, 
            state presentations, and enterprise sales.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/store/guides/capital-readiness"
              className="px-6 py-3 bg-brand-blue-600 rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              Get the Full Guide — $39
            </Link>
            <Link
              href="/store/guides/capital-readiness/enterprise"
              className="px-6 py-3 border border-slate-200 rounded-lg font-semibold hover:bg-white"
            >
              Enterprise Licensing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
