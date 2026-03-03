import Link from "next/link";
import Image from "next/image";

export function HomepageProgramsTeaser() {
  const programs = [
    {
      title: "Healthcare",
      description: "CNA, Medical Assistant, Pharmacy Tech, and more",
      image: "/images/artlist/hero-training-2.jpg",
      href: "/programs/cna",
    },
    {
      title: "Barber & Beauty",
      description: "DOL Registered Apprenticeships",
      image: "/images/programs-hq/training-classroom.jpg",
      href: "/programs/barber-apprenticeship",
    },
    {
      title: "Skilled Trades",
      description: "HVAC, Building Maintenance, CDL",
      image: "/images/gallery/image10.jpg",
      href: "/programs/hvac-technician",
    },
  ];

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-black md:text-2xl">
              Featured programs
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-black">
              Start your career in healthcare, trades, or beauty. Most programs are fully funded.
            </p>
          </div>
          <div>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-black hover:bg-slate-100"
            >
              View all programs
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {programs.map((program) => (
            <div
              key={program.href}
              className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition-shadow hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-semibold text-black">
                  {program.title}
                </h3>
                <p className="mt-1 text-xs text-black flex-1">{program.description}</p>
                <div className="mt-3">
                  <Link
                    href={program.href}
                    className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-brand-blue-700 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
