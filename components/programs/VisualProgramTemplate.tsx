import Link from 'next/link';
import Image from 'next/image';
import { getProgramImages } from '@/lib/program-images';
import type { Program } from '@/app/data/programs';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProgramTutorCTA } from '@/components/ProgramTutorCTA';
import { PROGRAMS } from '@/lib/ai/programRegistry';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

interface VisualProgramTemplateProps {
  program: Program;
  slug: string;
}

// Apprenticeship programs have special enrollment flow
const APPRENTICESHIP_SLUGS = ['barber', 'barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship'];

/**
 * Visual-first program page template
 * 
 * Design principles:
 * - Real photos only, NO icons or placeholders
 * - Minimal text, maximum visual impact
 * - Eligibility signaling is explicit
 * - Mobile-first, scannable layout
 */
export function VisualProgramTemplate({ program, slug }: VisualProgramTemplateProps) {
  const images = getProgramImages(slug);
  const isApprenticeship = APPRENTICESHIP_SLUGS.includes(slug) || 
    program.name?.toLowerCase().includes('apprenticeship') ||
    program.category?.toLowerCase().includes('apprenticeship');

  return (
    <main className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: program.name || program.heroTitle || 'Program' }]} />
        </div>
      </div>

      {/* HERO */}
      <section className="relative w-full">
        {program.heroVideo ? (
          <ProgramHeroBanner videoSrc={program.heroVideo} />
        ) : (
          <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
            <Image src={images.hero} alt={program.name || program.heroTitle || 'Program'} fill className="object-cover" priority sizes="100vw" />
          </div>
        )}
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              {program.name || program.heroTitle}
            </h1>
            <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
              Eligibility approval is required before enrollment. Start your application to check eligibility.
            </p>
            <Link
              href={`/apply?program=${slug}`}
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* PROGRAM SNAPSHOT - 4 Photo Cards */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">Program at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <SnapshotCard
              image={images.snapshot.jobOutcome}
              label="Career Outcome"
              description={program.credential || 'Industry-recognized credential'}
            />
            <SnapshotCard
              image={images.snapshot.programLength}
              label="Program Length"
              description={program.duration || 'Flexible scheduling'}
            />
            <SnapshotCard
              image={images.snapshot.credential}
              label="Credential"
              description={program.credential || 'Professional certification'}
            />
            <SnapshotCard
              image={images.snapshot.support}
              label="Support Included"
              description="Career coaching & job placement"
            />
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL DO - Visual Tile Grid */}
      {program.whatYouLearn && program.whatYouLearn.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">What You'll Learn</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {program.whatYouLearn.slice(0, 6).map((item: string, index: number) => (
                <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                  <Image
                    src={images.tiles[index % images.tiles.length]}
                    alt={item}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <p className="absolute bottom-3 left-3 right-3 text-slate-900 text-sm font-medium">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ELIGIBILITY & FUNDING */}
      <section className="py-12 px-4 bg-brand-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Eligibility & Funding</h2>
          <p className="text-slate-700 mb-2">
            This program requires eligibility approval through WorkOne / Indiana Career Connect.
          </p>
          <p className="text-slate-700 mb-2">
            Training is funded through state or federal workforce programs.
          </p>
          <p className="text-slate-600 text-sm mb-6">
            Final eligibility is confirmed after review with WorkOne.
          </p>
          <Link
            href={`/apply?program=${slug}`}
            className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Check Eligibility
          </Link>
        </div>
      </section>

      {/* WHAT UNLOCKS AFTER ENROLLMENT - apprenticeships only */}
      {isApprenticeship && (
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900 text-center">What Unlocks After Enrollment</h2>
              <p className="text-slate-600 mb-6 text-center">
                Payment secures your enrollment. Training access unlocks after approval and shop assignment.
              </p>
              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-blue-100 text-brand-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                  <span className="text-slate-700">Application submitted</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-blue-100 text-brand-blue-600 flex items-center justify-center text-sm font-bold">2</span>
                  <span className="text-slate-700">Payment received (if self-pay)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">⏳</span>
                  <span className="text-slate-700">Shop assignment</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">⏳</span>
                  <span className="text-slate-700">Compliance approval</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm">🔒</span>
                  <span className="text-slate-500">Training access (unlocks after approval)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WHAT HAPPENS NEXT - 4-Step Visual Flow */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">Your Path Forward</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StepCard
              image={images.steps.apply}
              step={1}
              label="Apply"
              description="Submit your application"
            />
            <StepCard
              image={images.steps.eligibility}
              step={2}
              label="Eligibility Review"
              description="WorkOne confirms eligibility"
            />
            <StepCard
              image={images.steps.training}
              step={3}
              label="Training"
              description="Complete your program"
            />
            <StepCard
              image={images.steps.career}
              step={4}
              label="Career Support"
              description="Job placement assistance"
            />
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px]">
        <Image
          src={images.bottomCta}
          alt="Start your career journey"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Your first step is confirming eligibility.
            </h2>
            <Link
              href={`/apply?program=${slug}`}
              className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition shadow-lg"
            >
              Start Eligibility Review
            </Link>
            {PROGRAMS[slug] && (
              <div className="mt-4">
                <ProgramTutorCTA
                  programSlug={slug}
                  programName={program.title}
                  applyHref={`/apply?program=${slug}`}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Snapshot Card Component
function SnapshotCard({ image, label, description }: { image: string; label: string; description: string }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3]">
        <Image
          src={image}
          alt={label}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

// Step Card Component
function StepCard({ image, step, label, description }: { image: string; step: number; label: string; description: string }) {
  return (
    <div className="relative">
      <div className="relative aspect-square rounded-xl overflow-hidden">
        <Image
          src={image}
          alt={label}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover"
        />
        <div className="absolute top-3 left-3 w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {step}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-slate-900">{label}</h3>
          <p className="text-slate-600 text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}
