import Image from 'next/image';

export function PlatformHubHero() {
  return (
    <section
      className="relative isolate h-[clamp(420px,72svh,820px)] overflow-hidden bg-slate-100"
      aria-label="Elevate for Humanity career training"
    >
      <h1 className="sr-only">Elevate for Humanity career training and apprenticeships</h1>
      <Image
        src="/images/beauty/program-beauty-training.webp"
        alt="Learners receiving hands-on career training in a professional classroom"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </section>
  );
}
