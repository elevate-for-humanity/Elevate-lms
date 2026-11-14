import Image from 'next/image';
import Link from 'next/link';
export function BarberBeautyNetworkGuide() {
  const cards = [
    {
      image: '/images/pages/barber-shop-interior.webp',
      title: 'Show your work',
      text: 'Share a haircut, style, nail set or training milestone. Explain what you practiced and what you learned.',
      href: '#community-post-composer',
      cta: 'Add a photo or video',
    },
    {
      image: '/images/partners/host-shop-mentoring-premium-2026.webp',
      title: 'Learn with the network',
      text: 'Open Groups below, find Barber & Beauty Network and select Join. Ask a question, exchange ideas and find mentorship.',
      href: '#community-tools',
      cta: 'Find the network group',
    },
    {
      image: '/images/partners/salon-saloon/team-studio.webp',
      title: 'Meet people in your industry',
      text: 'Introduce your shop or training goals. Build your opt-in profile and connect with other members.',
      href: '/lms/members',
      cta: 'Meet members',
    },
  ];
  return (
    <section className="mb-8 space-y-5" aria-label="How to use the Barber and Beauty Network">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wider text-violet-800">
          Shops · Students · Mentors
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Barber &amp; Beauty Network</h1>
        <p className="mt-3 max-w-3xl text-lg leading-7 text-slate-700">
          Build your portfolio, share your progress and connect with people who understand your
          craft. Shops and students post from their own accounts.
        </p>
      </header>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={card.image}
                alt={
                  card.title === 'Show your work'
                    ? 'Professional barbershop workspace'
                    : card.title === 'Learn with the network'
                      ? 'Supervised beauty training and mentorship'
                      : 'Salon professionals in their studio'
                }
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-black">{card.title}</h2>
              <p className="mt-2 leading-6 text-slate-700">{card.text}</p>
              <Link
                href={card.href}
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-violet-800 px-4 py-2 font-bold text-white"
              >
                {card.cta} →
              </Link>
            </div>
          </article>
        ))}
      </div>
      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-bold">Your first post: four simple steps</summary>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Write a short introduction or explain the service you practiced.</li>
          <li>
            Choose Add image, video, or PDF. Use your own work and keep attachments at or below 10
            MB.
          </li>
          <li>
            Add an accessibility description and the tag barber-and-beauty, then review your post.
          </li>
          <li>
            Select Post. Use Groups to join Barber &amp; Beauty Network, and reply constructively to
            other members.
          </li>
        </ol>
        <p className="mt-4 text-sm leading-6">
          Get permission before sharing identifiable clients or students. Keep private records and
          copyrighted course screenshots out of posts. A portfolio post does not replace the Host
          Shop’s Practical Service Log, hours approval or formal competency record.
        </p>
      </details>
    </section>
  );
}
