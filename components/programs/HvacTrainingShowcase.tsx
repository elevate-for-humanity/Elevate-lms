import Image from 'next/image';
import Link from 'next/link';

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
        <Image
          src={`${imageRoot}/lab-overview.webp`}
          alt="Wide view of the HVAC training-lab concept"
          width={1600}
          height={900}
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCtHNJbQ4t5V3EZMbZx6Y9j3qL+1b0xgrGCoyR8hrX0/SbWNWzGHOM5bmnS6VA98sxXDs4wc9MYpxdlqrjkrvQx3nNzgvKPLCl3XJGcfSitm90+2mGQgV+RuFFONRxVglFSdz//2Q=="
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="h-auto w-full rounded-2xl object-contain"
        />
        <figcaption className="mt-3 text-sm leading-6 text-slate-300">
          AI-generated training-lab concept. Explore the program details and confirmed training
          arrangements below.
        </figcaption>
      </div>
    </figure>
  );
}

export default function HvacTrainingShowcase({ compact = false }: { compact?: boolean }) {
  const headingId = compact ? 'hvac-home-showcase' : 'hvac-training-gallery';
  const selectedScenes = compact ? scenes.slice(0, 3) : scenes;
  return (
    <section
      aria-labelledby={headingId}
      data-hvac-training-showcase="20261029"
      className="border-y-4 border-orange-500 bg-blue-950 px-4 py-14 text-white sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-300">
          Sponsored by Elevate for Humanity
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2
              id={headingId}
              className="text-3xl font-black tracking-tight text-white sm:text-4xl"
            >
              {compact
                ? 'Build your next chapter in HVAC.'
                : 'See the skills you can start building.'}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Six-week hybrid HVAC training combines self-paced coursework, scheduled hands-on
              learning, and preparation for EPA Section 608 Core and Types I, II, and III.
            </p>
          </div>
          <Link
            href={compact ? '/programs/hvac-technician' : applyHref}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-center font-bold text-slate-950 hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300"
          >
            {compact ? 'Explore HVAC training' : 'Apply for HVAC training'}
          </Link>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-300">
          AI-generated lab concept, training demonstrations, and career illustrations.
        </p>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {selectedScenes.map((scene) => (
            <figure
              key={scene.image}
              className="overflow-hidden rounded-2xl border border-blue-800 bg-white shadow-xl"
            >
              <div className="relative aspect-[4/5] bg-slate-100">
                <Image
                  src={`${imageRoot}/${scene.image}.webp`}
                  alt={scene.alt}
                  fill
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
