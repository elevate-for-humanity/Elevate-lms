import { Metadata } from 'next';
import Link from 'next/link';
import { EBOOK_CHAPTERS } from '@/lib/ebook/barber-chapters';
import { BookOpen, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barber Theory Ebook | Elevate For Humanity',
  description: 'Interactive ebook for Indiana Barber Apprenticeship program. Complete curriculum with chapters, quizzes, and practical guides.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/ebook/barber-theory' },
};

export default function BarberTheoryEbookPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-brand-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Barber Theory Ebook</h1>
          <p className="text-xl text-slate-600 mb-8">
            Complete curriculum for the Indiana Barber Apprenticeship Program
          </p>
          <Link
            href="/pwa/barber"
            className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            Open Barber Portal
          </Link>
        </div>

        <div className="grid gap-4">
          {EBOOK_CHAPTERS.map((chapter, index) => (
            <Link
              key={chapter.id}
              href={`/ebook/barber-theory/${chapter.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-brand-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: chapter.accentBg, color: chapter.color }}
                    >
                      Chapter {index + 1}
                    </span>
                    {chapter.checkpoint && (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                        Checkpoint
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold mb-1">{chapter.shortTitle || chapter.title}</h2>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>{chapter.lessons.length} lessons</span>
                    <span>{Math.round(chapter.totalDurationMinutes / 60)} hours</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
