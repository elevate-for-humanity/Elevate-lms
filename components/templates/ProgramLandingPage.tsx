import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface ProgramLandingPageProps {
  category: string;
  title: string;
  description: string;
  duration: string;
  fundingTags: string[];
  format: string;
  imageSrc: string;
  imageAlt: string;
  whoThisIsFor: {
    description: string;
    bullets: string[];
  };
  whatYouLearn: string[];
  howItWorks: {
    step: number;
    title: string;
    description: string;
  }[];
  fundingOptions: string[];
  fundingNote?: string;
  schedule?: string;
  whatHappensAfter?: string;
  programSlug: string;
}

export default function ProgramLandingPage({
  category,
  title,
  description,
  duration,
  fundingTags,
  format,
  imageSrc,
  imageAlt,
  whoThisIsFor,
  whatYouLearn,
  howItWorks,
  fundingOptions,
  fundingNote,
  schedule,
  whatHappensAfter,
  programSlug,
}: ProgramLandingPageProps) {
  return (
    <main className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: category, href: `/programs/${category.toLowerCase().replace(/\s+/g, '-')}` }, { label: title }]} />
        </div>
      </div>

      {/* HERO */}
      <section className="border-b bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange-600">
              {category}
            </p>
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
            <p className="text-sm text-black">{description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-orange-100 px-3 py-2 font-medium text-brand-orange-800">
                {duration}
              </span>
              {fundingTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-brand-blue-100 px-3 py-2 font-medium text-brand-blue-800"
                >
                  {tag}
                </span>
              ))}
              <span className="rounded-full bg-brand-green-100 px-3 py-2 font-medium text-brand-green-800">
                {format}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/getstarted?program=${programSlug}`}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Start My Application
              </Link>
              <Link
                href={`/contact?topic=${programSlug}`}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-black hover:bg-slate-50"
              >
                Talk With Our Team
              </Link>
            </div>
          </div>

          <div className="relative h-56 w-full max-w-sm md:h-64">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="rounded-2xl object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* LAYOUT GRID */}
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[2fr,1fr]">
        {/* Left column */}
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-black">Who This Is For</h2>
            <p className="mt-2 text-sm text-black">{whoThisIsFor.description}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black">
              {whoThisIsFor.bullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-black">What You'll Learn</h2>
            <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm text-black">
              {whatYouLearn.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-black">How It Works</h2>
            <ol className="mt-2 space-y-2 text-sm text-black">
              {howItWorks.map((step) => (
                <li key={step.step}>
                  <span className="font-semibold">{step.step}. {step.title}.</span> {step.description}
                </li>
              ))}
            </ol>
          </div>

          {schedule && (
            <div>
              <h2 className="text-lg font-semibold text-black">Schedule & Format</h2>
              <p className="mt-2 text-sm text-black">{schedule}</p>
            </div>
          )}

          {whatHappensAfter && (
            <div>
              <h2 className="text-lg font-semibold text-black">What Happens After</h2>
              <p className="mt-2 text-sm text-black">{whatHappensAfter}</p>
            </div>
          )}
        </div>

        {/* Right column – Funding card */}
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-black h-fit">
          <h3 className="text-sm font-semibold text-black">Funding & Support</h3>
          <ul className="mt-2 space-y-1">
            {fundingOptions.map((option, idx) => (
              <li key={idx}>• {option}</li>
            ))}
          </ul>
          {fundingNote && (
            <p className="mt-3 text-xs text-slate-500">{fundingNote}</p>
          )}
        </aside>
      </section>
    </main>
  );
}
