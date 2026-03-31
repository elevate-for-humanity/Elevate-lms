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
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
         sizes="100vw" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-black">{title}</h3>
        <p className="text-black text-sm mb-4">{description}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}
