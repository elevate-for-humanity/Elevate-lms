import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { card, type as typeTokens } from '@/lib/page-design-tokens';

interface ProgramCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
}

export function ProgramCard({ title, description, image, href }: ProgramCardProps) {
  return (
    <article className={`${card.base} group flex h-full flex-col motion-reduce:transform-none motion-reduce:transition-none`}>
      <div className={card.programImage}>
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className={`${card.body} flex flex-1 flex-col`}>
        <h3 className={`${typeTokens.h3} mb-2`}>{title}</h3>
        <p className={`${typeTokens.bodySmall} mb-5 flex-1`}>{description}</p>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl bg-brand-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2"
        >
          See details <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
