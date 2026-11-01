import HomeSectionNarration from '@/components/home/HomeSectionNarration';
import Image from 'next/image';
import Link from 'next/link';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';
import { HvacVideoAssistanceDock } from './HvacVideoAssistanceDock';

const imageRoot = '/images/programs/hvac/elevate-20261029';
const applyHref = '/apply/student?program=hvac-technician';
const scenes = [
  {
    image: 'instructor-demo',
    title: 'Guided instruction',
    description: 'Explore system components with instructor-led demonstrations.',
    alt: 'Illustrative learner and instructor examining an air-conditioning trainer',
  },
  {
    image: 'recovery',
    title: 'Tools and recovery equipment',
    description:
      'Learn the purpose of gauges, recovery machines, and refrigerant-handling equipment.',
    alt: 'Illustrative instructor demonstrating recovery equipment to two adult learners',
  },
  {
    image: 'small-appliance',
    title: 'Small-appliance refrigeration',
    description: 'Connect EPA 608 Type I preparation to small-appliance components.',
    alt: 'Illustrative small-refrigerator component demonstration in the training-lab concept',
  },
  {
    image: 'gauges',
    title: 'Understand the system',
    description: 'Build a foundation in safety, pressure readings, and troubleshooting.',
    alt: 'Illustrative technician reviewing manifold gauges on an air-conditioning trainer',
  },
  {
    image: 'group-learning',
    title: 'Learn, discuss, and practice',
    description: 'Combine self-paced coursework with scheduled hands-on instruction.',
    alt: 'Illustrative adult learners reviewing an HVAC drawing with an instructor',
  },
  {
    image: 'lab-portrait',
    title: 'A vision for practical training',
    description: 'Explore the room layout, training stations, and tools in this lab concept.',
    alt: 'Portrait view of the orange-and-navy HVAC training-lab concept',
  },
  {
    image: 'career',
    title: 'Build your next chapter',
    description: 'Explore pathways in HVAC service, refrigeration, and building maintenance.',
    alt: 'Illustrative HVAC career scene beside an outdoor air-conditioning unit',
  },
];

export function HvacLabHero() {
  return (
    <figure className="border-b-4 border-orange-500 bg-blue-950 text-white">
      <div className="mx-auto max-w-7xl px-4 pb-5 pt-6 sm:px-6">
        <p className="mb-4 text-sm font-bold tracking-wide text-orange-300">
          Sponsored by Elevate for Humanity
        </p>
        <div className="relative overflow-hidden rounded-2xl bg-blue-950">
          <video
            aria-label="Elevate for Humanity HVAC training program introduction"
            data-hvac-hero-video="20261029"
            src="/videos/hvac-recruitment-20261029.mp4"
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="auto"
            poster={`${imageRoot}/lab-overview.webp`}
            width={1080}
            height={1350}
            className="mx-auto block max-h-[75svh] w-full object-contain"
          >
            Your browser does not support embedded video.{' '}
            <a href="/videos/hvac-recruitment-20261029.mp4">Watch the HVAC program video</a>.
          </video>
          <p className="px-4 py-3 text-center text-sm text-slate-200">
            Watch our HVAC program introduction. Use the video controls to turn on sound or pause.
          </p>
          <HvacVideoAssistanceDock />
        </div>
      </div>
    </figure>
  );
}

export default function HvacTrainingShowcase({ compact = false }: { compact?: boolean }) {
  const Heading = 'h2';
  const headingId = compact ? 'hvac-home-showcase' : 'hvac-training-gallery';
  const selectedScenes = compact ? scenes.slice(0, 3) : scenes;
  return (
    <section
      aria-labelledby={headingId}
      data-hvac-training-showcase="20261029"
      className={`border-y-4 border-orange-500 bg-blue-950 px-4 text-white sm:px-6 ${compact ? 'py-7 sm:py-10' : 'py-14 sm:py-20'}`}
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-300">
          {compact ? 'Featured program · HVAC Technician' : 'Sponsored by Elevate for Humanity'}
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Heading
              id={headingId}
              className="text-3xl font-black tracking-tight text-white sm:text-4xl"
            >
              {compact
                ? 'Build your next chapter in HVAC.'
                : 'See the skills you can start building.'}
            </Heading>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Six-week hybrid HVAC training combines self-paced coursework, scheduled hands-on
              learning, and preparation for EPA Section 608 Core and Types I, II, and III.
            </p>
          </div>
          {!compact && (
            <Link
              href={compact ? '/programs/hvac-technician' : applyHref}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-center font-bold text-slate-950 hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300"
            >
              {compact ? 'Explore HVAC training' : 'Apply for HVAC training'}
            </Link>
          )}
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-300">
          AI-generated lab concept, training demonstrations, and career illustrations.
        </p>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {selectedScenes.map((scene, index) => (
            <figure
              key={scene.image}
              className="overflow-hidden rounded-2xl border border-blue-800 bg-white shadow-xl"
            >
              <div className={`relative bg-slate-100 ${compact ? 'aspect-[4/3]' : 'aspect-[4/5]'}`}>
                <Image
                  src={`${imageRoot}/${scene.image}.webp`}
                  alt={scene.alt}
                  fill
                  priority={compact && index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 410px"
                  className="object-contain"
                />
              </div>
              <figcaption className="p-5">
                <h3 className="text-xl font-bold text-slate-950">{scene.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{scene.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        {compact && (
          <div className="mt-6 border-t border-blue-800 pt-6">
            <HomeSectionNarration section="funding" />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/programs/hvac-technician"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-5 py-3 font-bold text-slate-950 hover:bg-orange-400"
              >
                View HVAC program →
              </Link>
              <a
                href={WORKONE_INDY_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-center font-bold text-slate-950 hover:bg-slate-100"
              >
                Sign up to see if you qualify — WorkOne
              </a>
              <Link
                href="/onboarding/learner/orientation"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white px-5 py-3 font-bold text-white hover:bg-blue-900"
              >
                Complete your orientation
              </Link>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              WorkOne reviews funding eligibility; funding is not guaranteed. Start your orientation
              to get ready and connect with Elevate.
            </p>
          </div>
        )}
        {!compact && (
          <div className="mt-10 grid gap-7 rounded-2xl border border-blue-800 bg-blue-900 p-6 text-white sm:p-8 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold">Know the credential you are preparing for.</h3>
              <ul className="mt-4 space-y-3 leading-7 text-slate-200">
                <li>
                  <strong className="text-white">Type I:</strong> Small appliances.
                </li>
                <li>
                  <strong className="text-white">Type II:</strong> High- and very-high-pressure
                  equipment, excluding small appliances and motor-vehicle air conditioners.
                </li>
                <li>
                  <strong className="text-white">Type III:</strong> Low-pressure equipment,
                  including commercial chillers.
                </li>
              </ul>
              <p className="mt-4 leading-7 text-slate-200">
                Universal certification requires passing Core and all three types in secure,
                proctored exams through an EPA-approved certifying organization. EPA 608 credentials
                do not expire.
              </p>
              <p className="mt-3 leading-7 text-slate-200">
                Certification permits covered refrigerant work within the certification type. Course
                completion and EPA certification are separate milestones.
              </p>
              <a
                href="https://www.epa.gov/section608/section-608-technician-certification-requirements"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center font-semibold text-orange-300 underline underline-offset-4"
              >
                Review EPA certification requirements
              </a>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                WRG and WIOA funding for eligible participants.
              </h3>
              <p className="mt-4 leading-7 text-slate-200">
                Tuition funding may be available through the Workforce Ready Grant or WIOA. WorkOne
                or the responsible agency determines eligibility, covered costs, availability, and
                written authorization before funded enrollment.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/funding/wrg"
                  className="inline-flex min-h-12 items-center rounded-xl border border-slate-500 px-4 py-3 font-semibold"
                >
                  Workforce Ready Grant
                </Link>
                <Link
                  href="/funding/wioa"
                  className="inline-flex min-h-12 items-center rounded-xl border border-slate-500 px-4 py-3 font-semibold"
                >
                  WIOA / WorkOne
                </Link>
              </div>
              <Link
                href={applyHref}
                className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
              >
                Start your HVAC application
              </Link>
            </div>
          </div>
        )}
        {compact && (
          <p className="mt-6 max-w-4xl leading-7 text-slate-200">
            WRG or WIOA tuition funding may be available to eligible participants. Written agency
            authorization is required before funded enrollment.
          </p>
        )}
      </div>
    </section>
  );
}
