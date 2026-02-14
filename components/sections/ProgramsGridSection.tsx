import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign } from 'lucide-react';

interface Program {
  slug: string;
  name: string;
  shortDescription: string;
  duration: string;
  price?: string;
  heroImage?: string;
}

interface ProgramsGridSectionProps {
  title: string;
  programs: Program[];
}

export function ProgramsGridSection({ title, programs }: ProgramsGridSectionProps) {
  if (!programs || programs.length === 0) return null;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold text-black mb-8">{title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program) => (
            <Link
              key={program.slug}
              href={`/programs/${program.slug}`}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200"
            >
              {/* Image */}
              {program.heroImage && (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image loading="lazy"
                    src={program.heroImage}
                    alt={program.name}
                    fill
          sizes="100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-black mb-2 group-hover:text-brand-blue-600 transition-colors">
                  {program.name}
                </h3>
                <p className="text-black mb-4 line-clamp-2">
                  {program.shortDescription}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{program.duration}</span>
                  </div>
                  {program.price && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{program.price}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
