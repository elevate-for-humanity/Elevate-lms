import Link from 'next/link';
import Image from 'next/image';

export function BusinessNetworkCard({
  href,
  label = 'Business network',
}: {
  href: string;
  label?: string;
}) {
  if (href === '/host-shop/dashboard/community' || href === '#network-feed')
    return (
      <section className="my-5 overflow-hidden rounded-3xl bg-neutral-950 text-white">
        <div className="grid sm:grid-cols-[1fr_1.2fr]">
          <div className="relative min-h-48">
            <Image
              src="/images/partners/salon-saloon/team-studio.webp"
              alt="Beauty professionals in a participating Host Shop"
              fill
              sizes="(max-width: 640px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="p-5">
            <h2 className="text-2xl font-black">{label}</h2>
            <p className="mt-3 leading-7">
              Share your salon’s work, meet other beauty professionals, and discuss training.
            </p>
            <Link
              href={href}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 font-bold text-neutral-950"
            >
              Open the network →
            </Link>
          </div>
        </div>
      </section>
    );
  return (
    <section className="my-6 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-fuchsia-900 p-6 text-white shadow-lg">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
        Connect · Share your work · Grow together
      </p>
      <h2 className="mt-2 text-2xl font-black">{label}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7">
        Introduce your business, share portfolio photos and videos, discuss training, and connect
        with other members. Include your business name, a short bio, services, city, business email,
        phone, website, and booking link so people know how to reach you.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-7">
        Open Groups to find your network and select Join if you are not already a member. If an
        invitation or approval is required, follow the status shown there. An existing membership
        needs no second acceptance.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-7">
        Use the post attachment button to share your own photos or videos, then review and publish
        your post. Reply to discussions and contact members who permit messages. Public business
        profiles can help people find your services through search; private community content is not
        automatically published to Google, and search placement is not guaranteed.
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 font-black text-blue-950"
      >
        Open community and networks →
      </Link>
    </section>
  );
}
