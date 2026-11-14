import Image from 'next/image';
import Link from 'next/link';
import { APPROVED_VENDOR_LOGOS } from '@/data/vendors/approved-logos';

export function VerifiedVendorLogos() {
  if (!APPROVED_VENDOR_LOGOS.length) return null;
  return (
    <section
      aria-labelledby="vendor-resources-heading"
      className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="vendor-resources-heading" className="text-2xl font-black text-slate-950">
          Assessment and learning resources
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Explore resources used in our workforce pathways. Available training, assessments and
          credentials are confirmed for each program.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPROVED_VENDOR_LOGOS.map((logo) => (
            <Link
              href={logo.href}
              key={logo.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              <div className="flex h-24 items-center">
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={logo.width}
                  height={logo.height}
                  sizes="(max-width: 640px) 80vw, 340px"
                  className="h-auto max-h-20 w-full object-contain object-left"
                />
              </div>
              <p className="mt-4 font-black text-slate-950">{logo.name}</p>
              <p className="mt-1 text-sm text-slate-600">{logo.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
