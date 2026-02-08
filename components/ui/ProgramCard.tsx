import Image from 'next/image';
import Link from 'next/link';

interface ProgramCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
}

export function ProgramCard({ title, description, image, href }: ProgramCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-black">{title}</h3>
        <p className="text-black text-sm mb-4">{description}</p>
        <span className="text-brand-blue-600 text-sm font-medium inline-flex items-center gap-1">
          Learn More
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
