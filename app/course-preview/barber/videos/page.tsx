// Public preview page — no auth required
// Shows all generated barber lesson videos for review

import Link from 'next/link';

const VIDEOS = [
  { slug: 'barber-lesson-1',  title: 'Introduction to Barbering' },
  { slug: 'barber-lesson-2',  title: 'Professional Conduct & Ethics' },
  { slug: 'barber-lesson-3',  title: 'Tools & Equipment' },
  { slug: 'barber-lesson-4',  title: 'Sanitation & Infection Control' },
  { slug: 'barber-lesson-5',  title: 'Workplace Safety' },
  { slug: 'barber-lesson-6',  title: 'Client Consultation' },
  { slug: 'barber-module-1-checkpoint', title: 'Module 1 Checkpoint — Foundations & Safety' },
  { slug: 'barber-lesson-9',  title: 'The Hair Growth Cycle' },
  { slug: 'barber-lesson-10', title: 'Hair Texture, Density & Porosity' },
  { slug: 'barber-lesson-11', title: 'Scalp Conditions & Disorders' },
  { slug: 'barber-lesson-13', title: 'Shampoo Service & Scalp Massage' },
  { slug: 'barber-module-2-checkpoint', title: 'Module 2 Checkpoint — Hair Science' },
  { slug: 'barber-lesson-18', title: 'Shear, Clipper & Trimmer Techniques' },
  { slug: 'barber-lesson-19', title: 'Fading, Tapering & Blending' },
  { slug: 'barber-lesson-20', title: 'Head Shape, Face Shape & Cut Selection' },
  { slug: 'barber-lesson-22', title: 'Head Shape & Sectioning' },
  { slug: 'barber-lesson-23', title: 'The Fade — Low, Mid & High' },
  { slug: 'barber-lesson-27', title: 'Flat Top & Classic Cuts' },
  { slug: 'barber-lesson-29', title: 'Shave Preparation & Hot Towel Service' },
  { slug: 'barber-lesson-30', title: 'Straight Razor Shave Procedure' },
  { slug: 'barber-module-3-checkpoint', title: 'Module 3 Checkpoint — Haircutting' },
  { slug: 'barber-lesson-32', title: 'Post-Shave Care & Skin Treatment' },
  { slug: 'barber-lesson-33', title: 'Mustache Trimming & Styling' },
  { slug: 'barber-lesson-35', title: 'Hair Color Theory' },
  { slug: 'barber-lesson-36', title: 'Chemical Safety & Patch Testing' },
  { slug: 'barber-lesson-37', title: 'Relaxers & Texturizers' },
  { slug: 'barber-module-6-checkpoint', title: 'Module 6 Checkpoint — Chemical Services' },
  { slug: 'barber-lesson-44', title: 'Styling Products & Finishing' },
  { slug: 'barber-module-7-checkpoint', title: 'Professional Skills Checkpoint' },
  { slug: 'barber-indiana-state-board-exam', title: 'Program Final Exam' },
];

export default function BarberVideoPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-2">Elevate for Humanity</p>
          <h1 className="text-3xl font-bold text-white mb-2">Barber Apprenticeship — Lesson Videos</h1>
          <p className="text-gray-400 text-sm">{VIDEOS.length} lessons · ~2m 46s each · Generated with AI narration</p>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VIDEOS.map((v) => (
            <div key={v.slug} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
              <video
                src={`/videos/barber-lessons/${v.slug}.mp4`}
                controls
                preload="metadata"
                className="w-full aspect-video bg-black"
                poster=""
              />
              <div className="p-3">
                <p className="text-sm font-medium text-white leading-snug">{v.title}</p>
                <p className="text-xs text-gray-500 mt-1">{v.slug}.mp4</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/programs/barber-apprenticeship" className="text-amber-400 hover:underline text-sm">
            View Barber Apprenticeship Program →
          </Link>
        </div>
      </div>
    </div>
  );
}
