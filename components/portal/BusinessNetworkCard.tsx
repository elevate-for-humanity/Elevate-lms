import Link from 'next/link';

export function BusinessNetworkCard({ href, label = 'Business network' }: { href: string; label?: string }) {
  return <section className="my-6 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-fuchsia-900 p-6 text-white shadow-lg">
    <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Connect · Share your work · Grow together</p>
    <h2 className="mt-2 text-2xl font-black">{label}</h2>
    <p className="mt-3 max-w-3xl text-sm leading-7">Introduce your business, share portfolio photos and videos, discuss training, and connect with other members. Include your business name, a short bio, services, city, business email, phone, website, and booking link so people know how to reach you.</p>
    <p className="mt-3 max-w-3xl text-sm leading-7">Open Groups to find your network and select Join if you are not already a member. If an invitation or approval is required, follow the status shown there. An existing membership needs no second acceptance.</p>
    <p className="mt-3 max-w-3xl text-sm leading-7">Use the post attachment button to share your own photos or videos, then review and publish your post. Reply to discussions and contact members who permit messages. Public business profiles can help people find your services through search; private community content is not automatically published to Google, and search placement is not guaranteed.</p>
    <Link href={href} className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 font-black text-blue-950">Open community and networks →</Link>
  </section>;
}
