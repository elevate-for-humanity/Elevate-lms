import Image from "next/image";
import type { ContentSection } from "@/lib/pageVisuals";

interface ContentWithImageProps {
  section: ContentSection;
  reverse?: boolean;
}

export function ContentWithImage({ section, reverse }: ContentWithImageProps) {
  const hasImage = Boolean(section.imageSrc);

  return (
    <section className="">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center">
        <div className={reverse ? "md:order-2 md:w-1/2" : "md:w-1/2"}>
          <h2 className="text-lg font-semibold text-black">
            {section.title}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-black">
            {section.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
        {hasImage && (
          <div className={reverse ? "md:order-1 md:w-1/2" : "md:w-1/2"}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src={section.imageSrc!}
                alt={section.imageAlt || section.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 480px, 100vw"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
