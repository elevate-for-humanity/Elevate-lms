import Image from 'next/image';
import Link from 'next/link';
import {
  DOWNTOWN_TRAINING_ADDRESS,
  DOWNTOWN_TRAINING_CITY,
  DOWNTOWN_TRAINING_PROGRAMS,
} from '@/lib/partners/downtown-training';

export default function DowntownTrainingGallery({ showPhotos = true }: { showPhotos?: boolean }) {
  return (
    <section
      id="downtown-training"
      aria-labelledby="downtown-training-heading"
      className="bg-blue-50 px-5 py-14 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-800">
          Downtown Indianapolis
        </p>
        <h2
          id="downtown-training-heading"
          className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
        >
          Beauty training. A downtown destination.
        </h2>
        <address className="mt-4 text-lg not-italic leading-7 text-slate-700">
          {DOWNTOWN_TRAINING_ADDRESS}
          <br />
          {DOWNTOWN_TRAINING_CITY}
        </address>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {DOWNTOWN_TRAINING_PROGRAMS.map((item) => (
            <article
              key={item.program}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-blue-100"
            >
              {showPhotos ? <div className="relative aspect-[4/5]">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div> : null}
              <div className="p-6">
                <p className="text-sm font-bold text-blue-800">{item.name}</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{item.program}</h3>
                <p className="mt-3 leading-6 text-slate-700">{item.lead}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex min-h-11 items-center font-bold text-blue-800 underline underline-offset-4"
                >
                  Explore the programs
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl leading-7 text-slate-700">
          Contact Elevate to confirm downtown schedules, enrollment requirements, and training
          availability.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-800 px-6 py-3 font-bold text-white hover:bg-blue-700"
        >
          Ask about downtown training
        </Link>
      </div>
    </section>
  );
}
