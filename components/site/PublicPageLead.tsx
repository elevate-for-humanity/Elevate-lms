import Image from 'next/image';
import ImageMetadata from '@/components/marketing/ImageMetadata';
import Link from 'next/link';

interface LeadAction {
  href: string;
  label: string;
}

/** A compact photographic lead for pages whose own heading and content follow. */
export function PublicPageLead({
  image,
  alt,
  actions,
}: {
  image: string;
  alt: string;
  actions: readonly LeadAction[];
}) {
  return (
    <section
      aria-label="Page introduction and next actions"
      className="border-b border-slate-200 bg-slate-50"
    >
      <ImageMetadata src={image} description={alt} />
      <div className="relative aspect-video sm:aspect-auto sm:h-[clamp(220px,34svh,420px)] overflow-hidden bg-sky-100">
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-4 sm:px-6">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-600 ${index === 0 ? 'bg-brand-red-600 text-white hover:bg-brand-red-700' : 'border border-slate-300 bg-white text-slate-950 hover:bg-slate-100'}`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
