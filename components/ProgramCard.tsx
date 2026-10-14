import Image from 'next/image';
import Link from 'next/link';
import { Clock, DollarSign, ArrowRight } from 'lucide-react';

interface ProgramCardProps {
  title: string;
  description: string;
  duration: string;
  salary: string;
  image: string;
  link: string;
  badge?: string;
}

export function ProgramCard({
  title,
  description,
  duration,
  salary,
  image,
  link,
  badge = 'FREE',
}: ProgramCardProps) {
  return (
    <div className="flex h-full flex-col bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 hover:shadow-xl transition-all">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image sizes="100vw" src={image} alt={title} fill className="object-cover contrast-105 saturate-110" quality={90} />
        {badge && (
          <div className="absolute top-4 right-4 bg-brand-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            {badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-black mb-3">{title}</h3>
        <p className="text-black mb-4 line-clamp-2">{description}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-black">
            <Clock size={16} className="text-brand-blue-600" />
            <span className="font-semibold">{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-black">
            <DollarSign size={16} className="text-brand-green-600" />
            <span className="font-semibold">{salary}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href={link}
          className="mt-auto self-start inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors"
        >
          View Program <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
