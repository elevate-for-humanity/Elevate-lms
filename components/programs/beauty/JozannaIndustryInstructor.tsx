import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, Sparkles } from 'lucide-react';

type Industry = 'nail-technician' | 'esthetician';

const industryContent = {
  'nail-technician': {
    eyebrow: 'Nail Industry Leadership',
    role: 'Nail Technician & Nail Instructor',
    heading: 'Meet Jozanna George',
    image: '/images/jozanna-george.jpg',
    imageAlt: 'Jozanna George, Nail Technician and Nail Instructor at Mesmerized by Beauty Cosmetology Academy',
    bio: 'Jozanna George is a licensed Nail Technician and Nail Instructor who leads hands-on nail education through Mesmerized by Beauty Cosmetology Academy. She brings working knowledge of nail care, sanitation, client service, salon professionalism, technical skill development, and student preparation to Elevate’s Nail Technician Apprenticeship pathway.',
    focus: 'For nail apprentices, Jozanna connects classroom learning with real salon expectations. She helps learners build safe work habits, refine practical techniques, understand professional standards, and prepare for long-term success in the nail industry.',
  },
  esthetician: {
    eyebrow: 'Esthetics Industry Leadership',
    role: 'Licensed Esthetician & Beauty Educator',
    heading: 'Meet Jozanna George',
    image: '/images/jozanna-george.jpg',
    imageAlt: 'Jozanna George, licensed Esthetician and beauty educator at Mesmerized by Beauty Cosmetology Academy',
    bio: 'Jozanna George is a licensed Esthetician and multi-licensed beauty educator affiliated with Mesmerized by Beauty Cosmetology Academy. Her experience spans skincare education, sanitation and infection control, client consultation, professional treatment-room standards, beauty-industry program coordination, and learner support.',
    focus: 'For esthetician apprentices, Jozanna introduces the professional habits behind safe, client-centered esthetics practice. She helps learners connect theory, supervised practice, consultation, sanitation, and career readiness while preparing for Indiana’s esthetics education and licensing pathway.',
  },
} as const;

export default function JozannaIndustryInstructor({ industry }: { industry: Industry }) {
  const content = industryContent[industry];

  return (
    <section className="overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-white via-rose-50 to-amber-50 shadow-xl">
      <div className="grid lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
        <div className="relative min-h-[420px] overflow-hidden bg-slate-100 sm:min-h-[520px]">
          <Image
            src={content.image}
            alt={content.imageAlt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 38vw"
          />
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-rose-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            {content.eyebrow}
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {content.heading}
          </h2>
          <p className="mt-2 text-xl font-extrabold text-rose-700">{content.role}</p>
          <div className="mt-4 flex items-center gap-2 font-bold text-slate-700">
            <Award className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Mesmerized by Beauty Cosmetology Academy
          </div>
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            <p>{content.bio}</p>
            <p>{content.focus}</p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/about/team/jozanna-george"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-extrabold text-white hover:bg-slate-800"
            >
              Read Jozanna&apos;s Bio <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/schools/mesmerized-by-beauty"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 font-extrabold text-slate-900 hover:border-slate-500"
            >
              Mesmerized by Beauty <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
